Test coverage tool. It generates html [report like that](http://1602.ws/railwayjs/test-coverage)

## Installation

    npm install semicov

## It works only...

...only if your code has semicolons. And it will break badly-written javascript:

```javascript
if (condition) doSomething();
else doSomethingElse();
```

So, basically it should work very well for any code passed following [jslint](http://www.jslint.com) validations:

- [semicolons](http://www.jslint.com/lint.html#semicolon)
- [required blocks](http://www.jslint.com/lint.html#required)

## Usage

Put following line before very first line of your code

    var semicov = require('semicov');
    semicov.init('lib', 'My Awesome Lib Name'); // First argument 'lib' is name of dir with code
    process.on('exit', semicov.report);

And it will generate `./coverage/index.html` for you.

