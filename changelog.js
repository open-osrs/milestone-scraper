const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const staff = ['owain94', 'lucwousin', 'ganom', 'pklite', 'f0rmatme', 'xkylee', 'openosrs'];
const args = verifyArg(process.argv.slice(2));
const url = 'https://github.com/open-osrs/runelite/milestone/' + args[0] + '?closed=1';
const updateName = 'openosrs-update-' + args[1] + '.md';

function verifyArg(arg) {
    if (arg.length < 2) {
        throw new Error("Invalid Arguments.")
    }
    if (!isNumeric(arg[0])) {
        console.log("Invalid update number, please enter a proper numeric value.");
        throw new Error("Invalid Arguments.")
    }
    if (arg[1].split(' ').length > 1) {
        console.log("Invalid version argument, do not include spaces.");
        throw new Error("Invalid Arguments.")
    }
    return arg;
}

puppeteer.launch().then(async browser => {
    console.log("Attempting to connect to " + url);
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector('div[id^="issue_"]', {timeout: 5000});
    let content = await page.content();
    await query(content);
    await browser.close();
});

async function query(obj) {
    const $ = cheerio.load(obj);
    const map = new Map();
    const prUrls = [];
    const prNames = [];
    const names = [];
    $('div[id^="issue_"]').find('div > div.float-left.col-8.lh-condensed.p-2').each(function () {
        let prUrl = $(this).find('a[id^="issue"]').attr('href');
        let prName = $(this).find('a[id^="issue_"]').text();
        let name = $(this).find(`span.opened-by > a`).text();
        prUrls.push(prUrl);
        prNames.push(prName.toLowerCase());
        names.push(name.toLowerCase());
    });
    const uniqueNames = Array.from(new Set(names));
    let str = '>**';
    let i = 0;
    for (const name of uniqueNames) {
        const prs = new Map();
        for (const allIndex of getAllIndexes(names, name)) {
            prs.set(prNames[allIndex], prUrls[allIndex]);
        }
        map.set(name, prs);
        if (!staff.includes(name)) {
            if (i !== 0) {
                str += ', '
            }
            str += name;
            i++;
        }
    }

    const stream = fs.createWriteStream(updateName);

    stream.once('open', function () {
        console.log("Writing to disk now.");
        stream.write('> As always, we appreciate the staff for their efforts this week. Also, a special mention to the following users who have contributed on github this week:\n');
        stream.write(str + '**.\n');
        stream.write('> We are delivering a hurtful blow to P2W clients with every update, and every new user.\n');
        for (const [k, v] of map) {
            if (k === 'openosrs') {
                continue;
            }
            stream.write('##### [' + k + '](https://github.com/' + k + ')\n');
            for (const [prName, prUrl] of v) {
                stream.write('* [' + prName + '](https://github.com/' + prUrl + ')\n')
            }
            stream.write('\n')
        }
        stream.end();
        console.log("Changelog built and completed.")
    });
}

function getAllIndexes(arr, val) {
    let indexes = [];
    for (let i = 0; i < arr.length; i++)
        if (arr[i] === val) {
            indexes.push(i);
        }
    return indexes;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
