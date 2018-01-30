# HomeBot Core

**Start coding!** `@homebot/core` provides an easy to use framework for creating home-automation, device controllers and more. It features a Dependency-Injection system (based on Angular (2+)) that allows for easy creation and testing of plugins.

# Quick-Start

// TBD

# Contributing

In order to contribute to '@homebot/core' please follow the [contribution guidlines](../CONTRIBUTING.md).

## Building

In order to rebuild `@homebot/core` just run the following commands:

```bash
npm run build
```

The final build will be placed within the `dist/` folder. 

## Testing

Unit testing is done using `jest` by Facebook (`TODO: add link`). It is based upon `jasmine` but allows easier testing without requiring a browser (i.e. headless) and runs faster than `jasmine`.

In order to run the unit tests just execute the following command:

```bash
npm run test
```

This will run all tests and display statistics in the terminal. A detailed coverage report is generated in the `coverage` folder (which is not included in the git repo).

