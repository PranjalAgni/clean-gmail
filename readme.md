### A Node.js service which permanently delete unwanted mails in minutes :rocket:

<p align="center">
  <img src="https://user-images.githubusercontent.com/26196076/92521069-3cc83480-f23a-11ea-9846-737eb02d3880.gif" alt="clean gmail demo gif" />
</p>

## Table of Contents

- [Features](#features)
- [Installation](#installation)

<a name="features"></a>

# :sparkles: Features

- **Delete mails:** Get rid of unwanted mails and keeping mailbox always light.

- **Very Fast:** Clean gmail, scans for mails and efficiently schedules for deletion in batches.

- **Cron Inbuilt:** Cron daemon is built-in, so it watches for all incoming mails in background.

- **Easy to use:** Say goodbye to lengthy commands. Using clean-gmail is as simple as pressing subscribe button on youtube.

<a name="installation"></a>

# :hammer: Installation

- Create a **Google Cloud** account.

- Enable **Gmail API**, its totally free!

- Create a filterlist.txt file inside src directory, where we keep tha mail ids to be watched and cleaned

```bash
# -- First, clone the repository
git clone https://github.com/PranjalAgni/clean-gmail.git

# -- Navigate to the dir
cd clean-gmail

# -- Install dependencies
npm install

# -- And run!
npm run start
```
