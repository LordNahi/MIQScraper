const scraperObject = {
    url: 'https://allocation.miq.govt.nz/portal/organisation/7efc9b34-7dc1-4220-bc74-3f5558810dda/event/MIQ-DEFAULT-EVENT/accommodation',
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36",
    cookie: "visid_incap_1875607=8iD1Q6aYQNyVuPGvuPeXFyDGEGAAAAAAQUIPAAAAAABRVYAzxYOt2xL5f4xtp63o; incap_ses_529_1875607=WTQvKWzxH2PmOGFgBmNXB/HeIWAAAAAA0YwiziP3f40gZ1rd8/SNJg==; PHPSESSID=chfelqc014ukvhk04k8s86im7d",

    async scraper(browser){
        // Set calendar constants ...
        const CAL_BUTTON_NEXT = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-months > span.flatpickr-next-month";
        const CAL_BUTTON_PREV = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-months > span.flatpickr-prev-month";
        const CAL_CURRENT_MONTH = ".flatpickr-calendar > .flatpickr-months > .flatpickr-month > .flatpickr-current-month > span";
        const CAL_DAY_CONTAINER = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-innerContainer > div > div.flatpickr-days > div"
        const CAL_DAY_CONTAINER_ITEMS = "#accommodation > form > div > div.flatpickr-calendar.animate.inline > div.flatpickr-innerContainer > div > div.flatpickr-days > div > span"

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

        async function getDates(pMonth) {
            // NOTE: If I can filter out the straggler days bloating the dates ealier on
            // then I won't need to pass `pMonth` in there functions, be much nicer ...

            let results = [];

            // Determine which dates are available ...
            const dates = await page.$$(CAL_DAY_CONTAINER_ITEMS);
            for (const date of dates) {

                const classNameHandle = await date.getProperty("className");
                const classNameValue = await classNameHandle.jsonValue();
    
                // Aria-Label contains a readable date string ...
                const ariaHandle = await date.getProperty("ariaLabel");
                const ariaValue = await ariaHandle.jsonValue();
    
                const dateData = ariaValue.split(" ");
                const month = dateData[0];
                const day = dateData[1];

                // This filters out prev/next month data ...
                if (!classNameValue.split(" ").includes("flatpickr-disabled")) {
                    // Available ...

                    if (month.toLowerCase() === pMonth.toLowerCase()) {
                        results.push(month + " " + day);
                    }
                }
            }

            return results;
        }

        async function renderMonth(pMonth) {
            const queryableMonths = ["february", "march", "april", "may"];

            const getUpdatedMonth = async() => { return await page.evaluate(sel => { return document.querySelector(sel).textContent.trim() }, CAL_CURRENT_MONTH) };

            let calendarNextMonth = await page.$(CAL_BUTTON_NEXT);

            for (let i = 0; i < queryableMonths.length; i ++) {
                currentMonth = await getUpdatedMonth();

                const monthA = currentMonth.toLowerCase();
                const monthB = pMonth.toLowerCase();

                if (monthA !== monthB) {
                    await clickOnElement(calendarNextMonth);
                } else {
                    break;
                }
            }
        }

        async function getAvailableDates(url, pMonth) {
            const queryableMonths = ["february", "march", "april", "may"];

            await page.goto(url);
            await page.waitForSelector(CAL_DAY_CONTAINER);

            const availableDates = [];
            let getAll = false;

            // Check if this is even worth running ...
            if (!pMonth) {
                getAll = true;
            } else if (!queryableMonths.includes(pMonth)) {
                throw new Error(pMonth + " isn't a queryable month ...");
            }


            if (getAll) {
                const results = new Map();

                for (let month of queryableMonths) {
                    await renderMonth(month);

                    results.set(month, await getDates(month));
                }

                return results;
            } else {
                await renderMonth(pMonth);

                return await getDates(pMonth);
            }
        }

        let page = await browser.newPage();

        await page.setViewport({
            width: 1920,
            height: 3000  
        })
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

        // START HERE
        // Just do the same thing, except make it so you can query all months at once ...

        // Notify ...
        while(true) {
            try {
                const results =  await getAvailableDates(this.url);
                console.log("Results:", results);
            } catch (e) {
                console.error("Error:", e);
            }

            setTimeout(() => {}, 1000);
        }

        // browser.close();
    }

}

module.exports = scraperObject;