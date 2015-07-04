# coffee-compiler

coffee-compiler is an extension for the code editor CodeTasty that adds automatic compilation of CoffeScript files upon saving.


### Compile Options

LESS compile options can be set in the first line of the edited file:

    # out: ../js/main.js

out: compiled file destination

    # out: ., app.js, ../main.js
    # . - same path with js extension