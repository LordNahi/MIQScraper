const scraperObject = {
    url: 'https://allocation.miq.govt.nz/portal/organisation/7efc9b34-7dc1-4220-bc74-3f5558810dda/event/MIQ-DEFAULT-EVENT/accommodation',
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36",
    cookie: "visid_incap_1875607=8iD1Q6aYQNyVuPGvuPeXFyDGEGAAAAAAQUIPAAAAAABRVYAzxYOt2xL5f4xtp63o; incap_ses_529_1875607=WTQvKWzxH2PmOGFgBmNXB/HeIWAAAAAA0YwiziP3f40gZ1rd8/SNJg==; PHPSESSID=chfelqc014ukvhk04k8s86im7d",

    async scraper(browser){
        let page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "max-age=0",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "cookie": this.cookie,
            "user-agent": this.userAgent
        });

        console.log(`Navigating to ${this.url}...`);

        await page.goto(this.url);

        // Set viewport ...
        // await page.setViewport({
        //     width: 1920,
        //     height: 3000,
        //     deviceScaleFactor: 1,
        // });

        // Set calendar constants ...
        const CAL_BUTTON_NEXT = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-months > span.flatpickr-next-month";
        const CAL_BUTTON_PREV = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-months > span.flatpickr-prev-month";
        const CAL_CURRENT_MONTH = ".flatpickr-calendar > .flatpickr-months > .flatpickr-month > .flatpickr-current-month > span";
        const CAL_DAY_CONTAINER = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-innerContainer > div > div.flatpickr-days > div"
        const CAL_DAY_CONTAINER_ITEMS = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-innerContainer > div > div.flatpickr-days > div > span"

        const formattedDates = [];

        await page.waitForSelector(CAL_BUTTON_NEXT);
        await page.waitForSelector(CAL_BUTTON_PREV);

        let btnNext = await page.$(CAL_BUTTON_NEXT);
        let btnPrev = await page.$(CAL_BUTTON_PREV);

        const dates = await page.$$(CAL_DAY_CONTAINER_ITEMS);

        let resultsAvailability = [];
        let resultsDateStrings = [];
        let finalResults = [];

        // Determin which dates are available ...
        for (const date of dates) {
            const classNameHandle = await date.getProperty("className");
            const classNameValue = await classNameHandle.jsonValue();

            if (classNameValue.split(" ").includes("flatpickr-disabled")) {
                // Date is not available ...
                resultsAvailability.push("is NOT AVAILABLE");
            } else {
                // Date is available ...
                resultsAvailability.push("is AVAILABLE");
            }
        }

        // Now grab the dates ...
        for (const date of dates) {
            // Aria-Label contains a readable date string ...
            const ariaHandle = await date.getProperty("ariaLabel");
            const ariaValue = await ariaHandle.jsonValue();

            console.log(ariaValue)
            resultsDateStrings.push(ariaValue);
        }
        
        // Now mash them together like a first year uni student might do ...
        for (let i = 0; i < resultsDateStrings.length; i ++) {
            finalResults[i] = resultsDateStrings[i] +  " " + resultsAvailability[i];
        }

        // Did it work?
        console.log("Results:", finalResults);

        await clickOnElement(btnNext);

        async function clickOnElement(elem, x = null, y = null) {
            const rect = await page.evaluate(el => {
              const { top, left, width, height } = el.getBoundingClientRect();
              return { top, left, width, height };
            }, elem);
        
            // Use given position or default to center
            const _x = x !== null ? x : rect.width / 2;
            const _y = y !== null ? y : rect.height / 2;
        
            await page.mouse.click(rect.left + _x, rect.top + _y);
        }

        browser.close();
    }
}

module.exports = scraperObject;