/* eslint-disable no-await-in-loop */
const path = require("path");
const cron = require("node-cron");
const gmail = require("./services/gmail");
const reader = require("./services/reader");
const logger = require("./utils/logger");

const CREDENTIALS_JSON = path.join(__dirname, "../", "credentials.json");
const TOKEN_JSON = path.join(__dirname, "../", "token.json");
const FILTER_FILE = path.join(__dirname, "filterlist.txt");

const SCOPES = ["https://mail.google.com/"];

const getAuthClient = async (deleteTaskScheduler) => {
  try {
    logger.info("Initalizing the deletion process\n");
    const credentials = await gmail.getCredentials(CREDENTIALS_JSON);
    logger.info("Authorizing with Google\n");
    const oAuth2Client = await gmail.authorize(credentials, TOKEN_JSON, SCOPES);
    deleteTaskScheduler(oAuth2Client);
  } catch (err) {
    logger.error(err.stack);
  }
};

const deleteWrapper = async (oAuth2Client) => {
  try {
    logger.info("Scanning mails to be deleted\n");
    const filterList = reader.getFilterList(FILTER_FILE);
    const deletedMailsTrack = [];
    logger.info("Preparing to delete mails now");
    filterList.forEach(async (filterItem) => {
      let mailIdCollection = [];
      const { mails, token } = await gmail.getMailsByFilter(
        oAuth2Client,
        filterItem
      );

      mailIdCollection = mailIdCollection.concat(mails);
      let nextToken = token;
      while (nextToken) {
        const nextPageData = await gmail.getMailsByFilter(
          oAuth2Client,
          filterList,
          nextToken
        );

        nextToken = nextPageData.token;
        mailIdCollection = mailIdCollection.concat(nextPageData.mails);
      }

      await gmail.deleteMailsBatch(oAuth2Client, mailIdCollection);
      deletedMailsTrack.push({
        Filter: filterItem,
        Messages: mailIdCollection.length
      });

      if (deletedMailsTrack.length === filterList.length) {
        logger.info("Deleted mails summary \n\n ");
        console.table(deletedMailsTrack);
      }
    });
  } catch (err) {
    logger.error(err.stack);
  }
};

const deleteTaskScheduler = (oAuth2Client) => {
  cron.schedule("* * * * *", async () => {
    await deleteWrapper(oAuth2Client);
  });
};

getAuthClient(deleteTaskScheduler);
