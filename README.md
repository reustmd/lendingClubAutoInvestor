LendingClubAutoInvestor
=======================

CasperJS script to automatically reinvest idle cash in Lending Club.

The script requires that you've setup an investment filter within the Lending Club website.

Requirements
=======================
- PhantomJS 1.9.1+
- CasperJS 1.0.2+
- Lending Club account
- Lending Club investment filter

Usage
=======================
casperjs reinvestCash.js --email=[yourLendingClubEmail] --password=[yourLendingClubPassword] --minCash=50 --minReturn=8 --timeout=30000

All parameters are required.

- email: your lending club email address
- password: your lending club password
- minCash: the minimum amount of idle cash to invest, otherwise exit
- minReturn: the minimum expected return, otherwise exit
- timeout: the timeout in milliseconds for web operations

Automation Setup
======================
In order to fully automate this process, aside from having a usable script, we want to automate the actual running of the script.

I have my copy of the script running on AWS free tier.  I setup a micro EC2 instance as follows:

- Installed PhantomJS and CasperJS
- Installed mailutils (so I can have logs sent to my gmail)
- Cloned this repository to my home directory
- Created a bash wrapper script (see below)
- Added a crontab entry to run the script every Sunday at 6:05 Pacific

Sample Wrapper Script (runLendingClubInvest.sh)
======================
#!/bin/bash
kill $(pgrep phantomjs)
cd /home/ubuntu/lendingClubAutoInvestor
git pull
/usr/local/bin/casperjs /home/ubuntu/lendingClubAutoInvestor/reinvestCash.js [my parmeters, see usage above]

Sample Crontab
======================
MAILTO=reustmd@gmail.com
5 1 * * 0 /home/ubuntu/runLendingClubInvest.sh
