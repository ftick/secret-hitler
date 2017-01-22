#!/bin/bash

set -e

# Create a directory to place the game files
sudo mkdir /var/www/secret-hitler

# Create a system user
sudo useradd -c "" -d /var/www/secret-hitler -r -U -s /bin/bash secrethitler

# Own the game files folder
sudo chown secrethitler:secrethitler /var/www/secret-hitler

# Get the game sources
sudo su secrethitler
cd ~
git clone https://github.com/danrough/secret-hitler.git .
exit

# Globally install the necessary node modules
sudo su
cd /var/www/secret-hitler
npm install -g
exit
