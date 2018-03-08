# LeagueRPC ![](https://forthebadge.com/images/badges/made-with-javascript.svg) ![](https://forthebadge.com/images/badges/built-with-love.svg)

## Overview

LeagueRPC is a desktop client to bind [rich presence][0] from [League of Legends][league] to [Discord][discord]. The project was started on December 23, 2017, due to the fact that rich presence integration was present for many popular games, but not League of Legends. On February 28, 2018, I submitted a ticket to Riot Games Player support discussing the opportunity to add rich presence to the client itself. About nine days later, on March 7, 2018, rich presence was added to the client with patch 8.5.2. Whether this was a coincidence or direct cause, I don't know, but at least the functionality was added!

## The App

Since rich presence was finally added into the league client itself, some of the stretch features I had planned will not be completed. That being said, here is what the client can do:

On startup, LeagueRPC will identify your league account and pull specific data to personalize the application. Specifically, it will look at your last 20 games and calculate your most played champion. A random skin from that champion will be selected as the application's background.

![](https://i.imgur.com/oeYSYJB.gif)

On another startup you may get another skin.

![](https://i.imgur.com/Sh4P7yK.jpg)

The app also has intuitive settings management, allowing you to customize various aspects of functionality.

![](https://i.imgur.com/4XUTLyn.gif)

Simply click on the enable button, and rich presence integration will be started. The app must stay running in order to function. Once you join a game, information will be pulled from Riot's servers and sent to Discord. Example:

![](https://i.imgur.com/6m0JfQU.png)

### Final Notes

Unfortunately, some logistics made it difficult to release this app quickly, meaning now all the work has gone to waste. In the future, I may reuse some of the UI elements in another project. Enjoy the native integration!

Please leave a star if you like this project 😊

[0]: https://discordapp.com/rich-presence
[league]: https://na.leagueoflegends.com/en/
[discord]: https://discordapp.com/