/* eslint-disable consistent-return */
const fs = require("fs");
const chalk = require("chalk");
const { google } = require("googleapis");
const readline = require("readline");
const logger = require("../utils/logger");

const getFreshToken = async (oAuth2Client, SCOPES, tokenPath) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent"
  });

  logger.info("Authorize this app by visiting this URL: ");
  logger.links(authUrl);

  const readToken = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    readToken.question(
      chalk.cyan("Enter the code from that page here:"),
      (code) => {
        readToken.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) {
            return reject(err.message);
          }
          oAuth2Client.setCredentials(token);
          fs.writeFile(tokenPath, JSON.stringify(token), (error) => {
            if (error) {
              return reject(err.message);
            }
            logger.info("Token stored in: ", tokenPath);
            resolve();
          });
        });
      }
    );
  });
};

const authorize = async (credentials, tokenPath, SCOPES) => {
  return new Promise((resolve) => {
    const { client_secret, client_id, redirect_uris } = credentials.web;

    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    fs.readFile(tokenPath, async (err, token) => {
      if (err) await getFreshToken(oAuth2Client, SCOPES, tokenPath);
      else oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client);
    });
  });
};

const getCredentials = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, content) => {
      if (err) return reject(new Error(err));
      resolve(JSON.parse(content));
    });
  });
};

const getMailsByFilter = async (auth, filterItem, token = "") => {
  const gmail = google.gmail({ version: "v1", auth });
  const filteredMailDump = await gmail.users.messages.list({
    userId: "me",
    maxResults: 500,
    q: filterItem,
    pageToken: token
  });

  const messagesId = [];

  const messages = filteredMailDump?.data?.messages ?? [];
  messages.forEach((message) => messagesId.push(message.id));
  const nextToken = filteredMailDump?.data?.nextPageToken ?? null;
  return {
    mails: messagesId,
    token: nextToken
  };
};

const deleteMailsBatch = async (auth, messageIds) => {
  if (!messageIds.length) return;
  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.messages.batchDelete({
    userId: "me",
    resource: { ids: messageIds }
  });
};

module.exports = {
  getCredentials,
  authorize,
  getMailsByFilter,
  deleteMailsBatch
};
