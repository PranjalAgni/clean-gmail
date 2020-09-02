const path = require("path");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const { google } = require("googleapis");
const readline = require("readline");
const lineByLine = require("n-readlines");

const CREDENTIALS_JSON = path.join(__dirname, "../", "credentials.json");
const TOKEN_JSON = path.join(__dirname, "../", "token.json");
const FILTER_FILE = path.join(__dirname, "filterlist.txt");

const readFilePromise = util.promisify(fs.readFile);
const SCOPES = ["https://mail.google.com/"];

const authorize = (credentials, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  readFilePromise(TOKEN_JSON)
    .then((token) => {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    })
    .catch((err) => getNewToken(oAuth2Client, callback));
};
const getNewToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });

  console.log(
    chalk.yellow("Authorize this app by visiting this URL: ", authUrl)
  );

  const readToken = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readToken.question("Enter the code from that page here: ", (code) => {
    readToken.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        return console.log(chalk.red("Error recieving access token", err));
      }
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_JSON, JSON.stringify(token), (error) => {
        if (err) {
          return console.log(chalk.red(error));
        }
        console.log(chalk.cyan("Token stored in: ", TOKEN_JSON));
      });
      callback(oAuth2Client);
    });
  });
};

const getFilterList = (fileName) => {
  const filterList = [];
  const liner = new lineByLine(fileName);
  let line = liner.next();
  while (line) {
    filterList.push(line.toString("utf-8"));
    line = liner.next();
  }
  return filterList;
};

const getMessagesByFilter = async (auth, filter) => {
  const gmail = google.gmail({ version: "v1", auth });
  const filteredMailDump = await gmail.users.messages.list({
    userId: "me",
    maxResults: 500,
    q: filter
  });

  const filteredMails = [];

  const messages = filteredMailDump?.data?.messages ?? [];
  messages.forEach((message) => filteredMails.push(message.id));

  return filteredMails;
};

const deleteBatch = async (auth, messagesId) => {
  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.messages.batchDelete({
    userId: "me",
    resource: { ids: messagesId }
  });
};

const deleteMails = async (auth) => {
  const filteringList = getFilterList(FILTER_FILE);
  const finalResult = [];
  await filteringList.forEach(async (filterItem) => {
    const filteredMailsID = await getMessagesByFilter(auth, filterItem);
    if (filteredMailsID.length) {
      await deleteBatch(auth, filteredMailsID);
    }

    finalResult.push({
      Filter: filterItem,
      Messages: filteredMailsID.length
    });

    if (finalResult.length === filteringList.length) {
      console.log(
        chalk.cyan(
          "Deleted items summary ----------------------------------------------------"
        )
      );

      console.table(finalResult);
    }
  });
};

console.log(
  chalk.yellow(
    "Started to delete mails  ----------------------------------------------------\n\n"
  )
);

readFilePromise(CREDENTIALS_JSON)
  .then((content) => authorize(JSON.parse(content), deleteMails))
  .catch((err) => console.log(chalk.red(err)));
