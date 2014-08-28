# [AngularJS](http://angularjs.org/) directives specific to [Bootstrap](http://getbootstrap.com)

## Updating from upstream and making changes

### Setting up for the first time

1. Clone this repository.
2. `npm install`

### Before updating upstream & making changes

`master` contains the latest upstream
`upstream-stable` contains the lastest upstream stable release
`lmaster` contains our changes merged into `upstream-stable`. *THIS IS WHERE YOU NEED TO WORK IN!*

1. `git checkout master` Change to master branch
2. `git pull upstream master` Update master from the original source
3. `git fetch upstream --tags` Update stable relases from the original source
4. `git tag` See a list of stable relases (use the latest if possible)
5. `git checkout -B upstream-stable 0.11.0` Overwrite the latest stable into upstream-stable branch.
6. `git checkout lmaster` Change to the branch you'll work in.
7. `git pull origin lmaster` Update lmaster from our repository.
8. `git merge upstream-stable` Merge latest ui-bootstrap changed into our modifications if necessary and needed.

### Before committing changes
9. `grunt jshint` Make sure that the changes you made follows the standarts.
10. `grunt html2js` Merge templates into JavaScript files.
11. `grunt build:dropdown:modal:tooltip:progressbar:tabs:timepicker:typeahead:collapse:buttons:popover:datepicker` Build the modules which you want. *Please update this line, if you add other module, people will copy/paste this.*
