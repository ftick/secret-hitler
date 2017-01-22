#!/bin/bash

set -e

# Update sources, then dist-upgrade
#sudo apt-get update
#sudo apt-get dist-upgrade

# Install git, so that we can get the secret hitler
# sources
sudo apt-get install -y git

# Install node and build-essentials in order to be
# able to install the game
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential

# Install nginx
sudo apt-get install -y nginx

# Install postgresql-9.6
sudo sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt/ jessie-pgdg main' > /etc/apt/sources.list.d/postgresql.list"
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get upgrade
sudo apt-get install -y postgresql-9.6
