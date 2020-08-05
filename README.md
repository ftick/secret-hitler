Issues are disabled for this repo... Broken bash shell files!

# Secret Hitler Online
An online implementation of the board game [Secret Hitler](http://secrethitler.com), written in node.js and socket.io.

Play at [secrethitler.online](https://secrethitler.online) (requires 5 players, use guest accounts to test).

Supports 5-10 players, text or voice (beta) chat, and the game's core rule set. Game data is persisted to allow features like stat aggregation, or game replays in future.

# Attribution
"Secret Hitler" is a game designed by Max Temkin, Mike Boxleiter, Tommy Maranges, and Mackenzie Schubert. This adaptation is neither affiliated nor endorsed by the copyright holders.

# Installation
Steps to install are as follows:

1. Upload `install-the-games-dependencies.sh` to your server and run it with a user who has sudo privileges
2. Upload `install-the-game.sh` to your server, and run it with a user who has sudo privileges
3. Upload `tools/secret-hitler-game.service` to your server:
  - Move the file to `/lib/systemd/system/`
  - Ensure that it is owned by root, and is executable
  - Ensure that `/var/www/secret-hitler/server.js` is executable
4. Configure the database:
  - Alter `/etc/postgresql/YOUR-VERSION/main/postgresql.conf` so that postgres runs on `localhost`  
  - `sudo -u postgres psql -c "CREATE USER secrethitler WITH PASSWORD 'your_password';"`
  - `sudo -u postgres psql -c "CREATE DATABASE secrethitler;"`
  - `sudo -u postgres psql -d secrethitler -f /var/www/secret-hitler/schema.sql`
  - `sudo -u postgres psql -d secrethitler -c "GRANT SELECT, INSERT, UPDATE ON feedback, games, users TO secrethitler;"`

It is licensed under [Creative Commons BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) (non-commercial, attribution required).

# Screenshots
![Secret Hitler Online start](http://i.imgur.com/QJ1kEXS.png)
