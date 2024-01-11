/* eslint-disable no-await-in-loop */
const path = require("path");
const cron = require("node-cron");
const chalk = require("chalk");
const ora = require("ora");
const gmail = require("./services/gmail");
const reader = require("./services/reader");
const logger = require("./utils/logger");

const CREDENTIALS_JSON = path.join(__dirname, "../", "credentials.json");
const TOKEN_JSON = path.join(__dirname, "../", "token.json");
const FILTER_FILE = path.join(__dirname, "filterlist.txt");

const SCOPES = ["https://mail.google.com/"];

const getAuthClient = async (deleteTaskScheduler) => {
  try {
    logger.info("✔ Authorizing identity with Google");
    const credentials = await gmail.getCredentials(CREDENTIALS_JSON);
    const oAuth2Client = await gmail.authorize(credentials, TOKEN_JSON, SCOPES);
    deleteTaskScheduler(oAuth2Client);
  } catch (err) {
    logger.error(err.stack);
  }
};

const deleteWrapper = async (oAuth2Client) => {
  /**
   * @type {ora.Ora | null}
   */
  let deleteSpinner = null;
  try {
    logger.info("✔ Scanning mails to be deleted");
    const filterList = reader.getFilterList(FILTER_FILE);
    const deletedMailsTrack = [];
    deleteSpinner = ora(chalk.cyan("Starting to delete mails")).start();

    for (const filterItem of filterList) {
      let mailIdCollection = [];
      let nextPageToken = null;
      do {
        const { mails, token } = await gmail.getMailsByFilter(
          oAuth2Client,
          filterItem,
          nextPageToken
        );

        mailIdCollection = mailIdCollection.concat(mails);
        if (mailIdCollection.length > 1000) {
          // There is a gmail hard limit of 1000 mails to be deleted in batch
          mailIdCollection = mailIdCollection.slice(0, 900);
          break;
        }
        nextPageToken = token;
      } while (nextPageToken);

      await gmail.deleteMailsBatch(oAuth2Client, mailIdCollection);
      deletedMailsTrack.push({
        Filter: filterItem,
        Messages: mailIdCollection.length
      });

      if (deletedMailsTrack.length === filterList.length) {
        deleteSpinner.succeed();
        logger.info("✔ Deleted mails summary \n\n ");
        // eslint-disable-next-line no-console
        console.table(deletedMailsTrack);
      }
    }
  } catch (err) {
    deleteSpinner.fail();
    logger.error(err.stack);
  }
};

const deleteTaskScheduler = (oAuth2Client) => {
  // JS cron expression also has optional parameter for seconds
  // Runs every 30 seconds
  cron.schedule("0,30 * * * * *", async () => {
    await deleteWrapper(oAuth2Client);
  });
};

getAuthClient(deleteTaskScheduler);
