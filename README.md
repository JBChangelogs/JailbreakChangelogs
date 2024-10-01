[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](./LICENSE)

> [!CAUTION]
> The only official sources for information and updates about the changelogs are https://jailbreakchangelogs.xyz and the game's [official Discord server](https://discord.gg/jailbreak). Any other websites or platforms claiming to represent or provide content for this repo are not controlled by us.

![Logo](https://res.cloudinary.com/dsvlphknq/image/upload/v1727392622/logos/changelogs.png)

# Roblox Jailbreak Changelogs

Welcome to the unofficial changelog repository for [Roblox Jailbreak](https://www.roblox.com/games/606849621/Jailbreak). This website is your go-to resource for comprehensive, up-to-date information on all changes, updates, and patches for the game.

## Website Features

Our changelog website provides:

- **Up-to-date changelogs:** Stay informed with the latest Jailbreak changes as they happen.
- **User-Friendly Interface:** Navigate effortlessly through a clean, intuitive design.
- **Responsive Layout:** Enjoy seamless access across all devices - desktop, tablet, or mobile.
- **Comprehensive Archives:** Explore the full history of Jailbreak updates and patches dating back to the game's release in 2017.

## Acknowledgements

- [Jalenzz16](https://github.com/Jalenzzz) - Co-founder & Lead Front-end Developer
- [Jakobiis](https://github.com/v3kmmw/) - Co-founder, Lead Back-end Developer & API Architect

## API Reference

Base URL: `https://api.jailbreakchangelogs.xyz`

### Seasons

#### Get Season Details

```http
    GET /seasons/get

```

| Parameter | Type      | Description                 |
| :-------- | :-------- | :-------------------------- |
| `season`  | `integer` | **Required**. Season number |

Returns the details of a specific season.

#### List All Seasons

```http
  GET /seasons/list
```

Returns a list of all seasons.

### Rewards

#### Get Season Rewards

```http
  GET /rewards/get
```

| Parameter | Type      | Description                 |
| :-------- | :-------- | :-------------------------- |
| `season`  | `integer` | **Required**. Season number |

Returns the rewards for a specific season.

#### List All Rewards

```http
  GET /rewards/list
```

Returns a list of all rewards for all seasons.

### Comments

#### Get Comments

```http
  GET /comments/get
```

| Parameter | Type      | Description                                              |
| :-------- | :-------- | :------------------------------------------------------- |
| `type`    | `string`  | **Required**. Type of comments ('changelog' or 'season') |
| `id`      | `integer` | **Required**. ID of the changelog, season, or comment    |

Returns comments based on the provided parameters:

1. With both `type` and `id`:

- For `type=season`, `id` refers to the season number (e.g., id=1 is season 1)
- For `type=changelog`, `id` refers to the changelog ID (e.g., id=1 is the first recorded changelog from April 21st, 2017)

2. With only `id`:

- Returns a specific comment

3. Without parameters:

- Returns all comments

### Changelogs

#### Get Specific Changelog

```http
  GET /changelogs/get
```

| Parameter | Type      | Description                |
| :-------- | :-------- | :------------------------- |
| `id`      | `integer` | **Required**. Changelog ID |

Returns the changelog for the given ID.

#### List All Changelogs

```http
  GET /changelogs/list
```

Returns a list of all changelogs.

### Users

#### Get User Data

```http
  GET /users/get
```

| Parameter | Type      | Description                   |
| :-------- | :-------- | :---------------------------- |
| `id`      | `integer` | **Required**. Discord User ID |

Returns user data based on Discord User ID.

To find your Discord User ID, follow the instructions here: [Where can I find my User/Server/Message ID?](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID)

### Authentication

To use any of these API endpoints outside the website, you need an API key. You can obtain an API key from https://jailbreakchangelogs.xyz/api.

## Contributing

Contributions are always welcome!

See [CONTRIBUTING.md](./CONTRIBUTING.md) for ways to get started.

## FAQ

Visit https://jailbreakchangelogs.xyz/faq

## Stay Connected

- Follow the devs and official game account on Twitter/X for real-time update notifications:

  - [@asimo3089](https://x.com/asimo3089)
  - [@badcc](https://x.com/badccvoid)
  - [@badimo](https://x.com/badimo) (Official Jailbreak account)

- Join our [Discord community](https://discord.com/invite/tWbDg7MbUU) to discuss changes and connect with other players or make feature requests.
- For support, reach out to [support@jailbreakchangelogs.xyz](mailto:support@jailbreakchangelogs.xyz)

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

This means you are free to use, modify, and distribute this software, provided that any derivative works are also distributed under the same license terms.

For more details, see the [LICENSE](./LICENSE) file in this repository or visit the [GNU GPL v3.0 page](https://www.gnu.org/licenses/gpl-3.0.en.html).

## Disclaimer

This is an unofficial, fan-made project and is not affiliated with or endorsed by Badimo/Jailbreak development team.

---

We hope this project enhances your Jailbreak experience.

Leave a ⭐ if you like the project.
