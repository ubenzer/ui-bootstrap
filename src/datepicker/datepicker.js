angular.module('ui.bootstrap.datepicker', ['ui.bootstrap.dateparser', 'ui.bootstrap.position'])

  .constant('datepickerConfig', {
    formatInput: 'longDate',
    formatDay: 'dd',
    formatMonth: 'MMMM',
    formatYear: 'yyyy',
    formatDayHeader: 'EEE',
    formatDayTitle: 'MMMM yyyy',
    formatMonthTitle: 'yyyy',
    datepickerMode: 'day',
    minMode: 'day',
    maxMode: 'year',
    showWeeks: false,
    startingDay: 1,
    yearRange: 20,
    minDate: new Date(Date.UTC(2999, 11, 31)),
    maxDate: new Date(Date.UTC(1900, 1, 1)),
    closeOnDateSelection: true,
    appendToBody: false,
    templateUrl: 'template/datepicker/datepicker.html'
  })

  .controller('DatepickerController', ['$scope', '$timeout', 'dateFilter', 'datepickerConfig',
    '$element', 'dateParser', function($scope, $timeout, dateFilter, datepickerConfig, $element, dateParser) {

      var today = (function() {
        var d = new Date();
        d.setUTCHours(0,0,0,0);
        return d;
      })();

      $scope.$datepickerCtrl = this;
      var self = this,
        ngModelCtrl = {
          $setViewValue: angular.noop,
          $render: angular.noop
        }; // nullModelCtrl;

      // Modes chain
      this.modes = ['day', 'month', 'year'];

      // Set defaults for undefined settings
      angular.forEach(['formatInput', 'formatDay', 'formatMonth', 'formatYear', 'formatDayHeader', 'formatDayTitle',
        'formatMonthTitle', 'datepickerMode', 'minMode', 'maxMode', 'showWeeks', 'startingDay', 'yearRange',
        'minDate', 'maxDate', 'closeOnDateSelection'], function(key) {
        $scope[key] = angular.isDefined($scope[key]) ? $scope[key] : datepickerConfig[key];
      });

      this.activeDate = angular.copy(today);

      this.init = function( ngModelCtrl_ ) {
        ngModelCtrl = ngModelCtrl_;

        var viewToModel = function(viewValue) {
          if (!viewValue) {
            return null;
          } else if (angular.isDate(viewValue)) {
            return viewValue;
          } else if (angular.isString(viewValue)) {
            var date = dateParser.parse(viewValue, $scope.formatInput);
            if (angular.isDate(date)) {
              return date;
            } else {
              return undefined;
            }
          } else {
            return undefined;
          }
        };
        var modelToView = function(modelValue) {
          if(angular.isDate(modelValue)) {
            return modelValue;
          } else {
            return undefined;
          }
        };
        var onViewChange = function() {
          self.render();
        };

        var dateToString = function(modelValue) {
          if(angular.isDate(modelValue)) {
            return dateFilter(modelValue, $scope.formatInput);
          } else {
            return '';
          }
        };

        ngModelCtrl.$$parserName = 'date';

        ngModelCtrl.$validators.minDate = function(modelValue, viewValue) {
          var value = modelValue || viewValue;
          if(!angular.isDate(value) || !angular.isDate($scope.minDate)) { return true; }
          return self.dayCompare(value, $scope.minDate) >= 0;
        };
        ngModelCtrl.$validators.maxDate = function(modelValue, viewValue) {
          var value = modelValue || viewValue;
          if(!angular.isDate(value) || !angular.isDate($scope.maxDate)) { return true; }
          return self.dayCompare(value, $scope.maxDate) <= 0;
        };

        ngModelCtrl.$parsers.unshift(viewToModel);
        ngModelCtrl.$formatters.unshift(modelToView);
        ngModelCtrl.$viewChangeListeners.unshift(onViewChange);

        ngModelCtrl.$render = function() {
          $element.val(dateToString(ngModelCtrl.$modelValue));
          self.render();
        };

        ngModelCtrl.$render();
        ngModelCtrl.$validate();
      };

      this.render = function() {
        if ( ngModelCtrl.$modelValue ) {
          var date = angular.copy(ngModelCtrl.$modelValue);
          var isValid = angular.isDate(date);

          if ( isValid ) {
            this.activeDate = date;
          } else {
            this.activeDate = angular.copy(today);
          }
        } else {
          this.activeDate = angular.copy(today);
        }
        this.refreshView();
      };

      this.refreshView = function() {
        if(!$scope.isOpen) { return; }
        if(!angular.isFunction(self._refreshView)) { return; }
        self._refreshView();
      };

      this.createDateObject = function(date, format) {
        return {
          date: date,
          label: dateFilter(date, format),
          disabled: this.isDisabled(date),
          current: this.compare(date, today) === 0
        };
      };

      this.isDisabled = function( date ) {
        return (($scope.minDate && this.compare(date, $scope.minDate) < 0) || ($scope.maxDate && this.compare(date, $scope.maxDate) > 0));
      };

      // Split array into smaller arrays
      this.split = function(arr, size) {
        var arrays = [];
        while (arr.length > 0) {
          arrays.push(arr.splice(0, size));
        }
        return arrays;
      };

      this.isMoveEnabled = function(direction, compareDate) {
        if(direction < 0) {
          if(!angular.isDate(compareDate)) {
            compareDate = angular.copy(self.firstDate);
            compareDate.setDate( compareDate.getDate() - 1 );
          }

          if($scope.minDate && self.dayCompare(compareDate, $scope.minDate) < 0) {
            return false;
          }
        } else {
          if(!angular.isDate(compareDate)) {
            compareDate = angular.copy(self.lastDate);
            compareDate.setDate( compareDate.getDate() + 1 );
          }
          if($scope.maxDate && self.dayCompare(compareDate, $scope.maxDate) > 0) {
            return false;
          }
        }
        return true;
      };

      this.dayCompare = function(date1, date2) {
        return (Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate()) - Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate()));
      };

      $scope.isActive = function(dateObject) {
        return self.compare(dateObject.date, self.activeDate) === 0;
      };

      $scope.select = function( date ) {
        if(self.isDisabled(date)) { return; }

        if ( $scope.datepickerMode === $scope.minMode ) {

          $scope.onSelectCallback({$date: date});

          ngModelCtrl.$setViewValue( date );
          ngModelCtrl.$render();

          if($scope.closeOnDateSelection) {
            $scope.isOpen = false;
          }
        } else {
          self.activeDate = date;
          $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) - 1 ];
        }
      };

      $scope.move = function( direction ) {
        if(!self.isMoveEnabled(direction)) { return; }

        var year = self.activeDate.getFullYear() + direction * (self.step.years || 0),
          month = self.activeDate.getMonth() + direction * (self.step.months || 0);
        self.activeDate.setFullYear(year, month, 1);
        self.refreshView();
      };

      $scope.toggleMode = function( direction ) {
        direction = direction || 1;

        if (($scope.datepickerMode === $scope.maxMode && direction === 1) || ($scope.datepickerMode === $scope.minMode && direction === -1)) {
          return;
        }

        $scope.datepickerMode = self.modes[ self.modes.indexOf( $scope.datepickerMode ) + direction ];
      };

      this.onKeydown = function(evt) {
        var key;
        if(evt.which == 13)      { key = 'enter';    }
        else if(evt.which == 9)  { key = 'tab';      }
        else if(evt.which == 38) { key = 'up';       }
        else if(evt.which == 40) { key = 'down';     }
        else if(evt.which == 37) { key = 'left';     }
        else if(evt.which == 39) { key = 'right';    }
        else if(evt.which == 27) { key = 'escape';   }
        else if(evt.which == 33) { key = 'pageup';   }
        else if(evt.which == 34) { key = 'pagedown'; }
        else if(evt.which == 36) { key = 'home';     }
        else if(evt.which == 35) { key = 'end';      }
        else { return; }

        if($scope.isOpen) {
          if(key == 'enter' || key == 'tab') {
            $scope.select(self.activeDate);
          }
          if(key == 'escape') {
            $scope.isOpen = false;
          }
          if(angular.isFunction(self._onKeydown)) {
            self._onKeydown(key);
          }
          if(key != 'tab') {
            evt.preventDefault();
          }
        } else {
          if(key == 'down' || key == 'enter') {
            $scope.isOpen = true;
            evt.preventDefault();
          }
        }
        $scope.$apply();
      };
    }])

  .directive('datepicker', ['$http', '$templateCache', '$compile', '$timeout', '$position',
    '$document', 'datepickerConfig', function ($http, $templateCache, $compile, $timeout, $position,
                                               $document, datepickerConfig) {

      return {
        restrict: 'A',
        scope: {
          isOpen: '=?',
          appendToBody: '=?',

          formatInput: '=?',
          formatDay: '=?',
          formatMonth: '=?',
          formatYear: '=?',
          formatDayHeader: '=?',
          formatDayTitle: '=?',
          formatMonthTitle: '=?',

          minDate: '=?',
          maxDate: '=?',

          startingDay: '=?',
          yearRange: '=?',
          showWeeks: '=?',

          minMode: '=?',
          maxMode: '=?',

          closeOnDateSelection: '=?',

          datepickerMode: '=?',
          ngDisabled: '=?',

          onSelectCallback: '&onSelect'
        },
        require: ['datepicker', '?ngModel'],
        controller: 'DatepickerController',
        link: function(scope, element, attrs, ctrls) {
          var datepickerCtrl = ctrls[0],
            ngModelCtrl = ctrls[1],
            datepickerElement = null;

          $http.get(datepickerConfig.templateUrl, {cache: $templateCache}).then(function(template) {
            datepickerElement = angular.element(template.data);
            if(ngModelCtrl) { datepickerCtrl.init(ngModelCtrl); }

            $compile(datepickerElement)(scope);

            scope.$watch('ngDisabled', function(value) {
              if(value === true) {
                scope.isOpen = false;
              }
            });

            scope.$watch('isOpen', function(value, oldValue) {
              if(value === oldValue) { return; }
              if(value) {

                if(scope.ngDisabled) { scope.isOpen = false; return; }
                if(scope.appendToBody) {
                  scope.position = $position.offset(element);
                  $('body').append(datepickerElement);
                } else {
                  scope.position = $position.position(element);
                  datepickerElement.insertAfter(element);
                }
                scope.position.top = scope.position.top + element.prop('offsetHeight');

                datepickerCtrl.render();

                $timeout(function() {
                  element.focus();
                  $document.bind('click', documentClickBind);
                });
              } else {
                $document.unbind('click', documentClickBind);
              }
            });

            function preventDefault(event) {
              event.preventDefault();
              event.stopPropagation();
            }
            function documentClickBind(event) {
              if (scope.isOpen && event.target !== element[0]) {
                scope.$apply(function() {
                  scope.isOpen = false;
                });
              }
            }
            element.bind('focus click', function() {
              if(scope.ngDisabled) { return; }
              scope.$apply(function() {
                scope.isOpen = true;
              });
            });
            element.bind('blur', function() {
              scope.$apply(function() {
                scope.isOpen = false;
              });
            });
            datepickerElement.bind('mousedown click', preventDefault);
            element.bind('keydown', datepickerCtrl.onKeydown);
            scope.$on('$destroy', function() {
              datepickerElement.remove();
              $document.unbind('click', documentClickBind);
            });
          });
        }
      };
    }])

  .directive('daypicker', ['dateFilter', function (dateFilter) {
    return {
      restrict: 'E',
      templateUrl: 'template/datepicker/day.html',
      link: function(scope) {
        var ctrl = scope.$datepickerCtrl;

        ctrl.step = { months: 1 };

        function getDaysInMonth( year, month ) {
          var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          return ((month === 1) && (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0))) ? 29 : DAYS_IN_MONTH[month];
        }

        function getDates(startDate, n) {
          var dates = new Array(n), current = new Date(startDate), i = 0;
          while ( i < n ) {
            dates[i++] = new Date(current);
            current.setDate( current.getDate() + 1 );
          }
          return dates;
        }

        ctrl._refreshView = function() {
          var year = ctrl.activeDate.getFullYear(),
            month = ctrl.activeDate.getMonth(),
            firstDayOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
            lastDayOfMonth = (function() {
              var lastDay = angular.copy(firstDayOfMonth);
              lastDay.setDate(getDaysInMonth(year, month));
              return lastDay;
            })(),
            difference = scope.startingDay - firstDayOfMonth.getDay(),
            numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : - difference,
            firstDate = angular.copy(firstDayOfMonth);

          if ( numDisplayedFromPreviousMonth > 0 ) {
            firstDate.setDate( - numDisplayedFromPreviousMonth + 1 );
          }

          // 42 is the number of days on a six-month calendar
          var days = getDates(firstDate, 42);
          for (var i = 0; i < 42; i ++) {
            var secondary = days[i].getMonth() !== month;
            days[i] = ctrl.createDateObject(days[i], scope.formatDay);
            days[i].secondary = secondary;
          }

          ctrl.firstDate = firstDayOfMonth;
          ctrl.lastDate = lastDayOfMonth;

          scope.labels = new Array(7);
          for (var j = 0; j < 7; j++) {
            scope.labels[j] = dateFilter(days[j].date, scope.formatDayHeader);
          }

          scope.title = dateFilter(ctrl.activeDate, scope.formatDayTitle);
          scope.rows = ctrl.split(days, 7);

          if ( scope.showWeeks ) {
            scope.weekNumbers = [];
            var weekNumber = getISO8601WeekNumber( scope.rows[0][0].date ),
              numWeeks = scope.rows.length;
            while( scope.weekNumbers.push(weekNumber++) < numWeeks ) {}
          }
        };

        ctrl.compare = ctrl.dayCompare;

        function getISO8601WeekNumber(date) {
          var checkDate = new Date(date);
          checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
          var time = checkDate.getTime();
          checkDate.setMonth(0); // Compare with Jan 1
          checkDate.setDate(1);
          return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
        }

        ctrl._onKeydown = function(key) {
          var candidateDate = angular.copy(ctrl.activeDate);
          var direction = 1;

          if (key === 'left') {
            candidateDate.setDate(candidateDate.getDate() - 1);
            direction = -1;
          } else if (key === 'up') {
            candidateDate.setDate(candidateDate.getDate() - 7);
            direction = -1;
          } else if (key === 'right') {
            candidateDate.setDate(candidateDate.getDate() + 1);
          } else if (key === 'down') {
            candidateDate.setDate(candidateDate.getDate() + 7);
          } else if (key === 'pageup') {
            candidateDate.setMonth(candidateDate.getMonth() - 1, Math.min(getDaysInMonth(candidateDate.getFullYear(), candidateDate.getMonth()), candidateDate.getDate()));
            direction = -1;
          } else if (key === 'pagedown') {
            candidateDate.setMonth(candidateDate.getMonth() + 1, Math.min(getDaysInMonth(candidateDate.getFullYear(), candidateDate.getMonth()), candidateDate.getDate()));
          } else if (key === 'home') {
            candidateDate.setDate(1);
            direction = -1;
          } else if (key === 'end') {
            candidateDate.setDate(getDaysInMonth(candidateDate.getFullYear(), candidateDate.getMonth()));
          }

          if(!ctrl.isMoveEnabled(direction, candidateDate)) {
            return;
          }

          ctrl.activeDate = candidateDate;
          ctrl._refreshView();
        };
        ctrl.refreshView();
      }
    };
  }])

  .directive('monthpicker', ['dateFilter', function (dateFilter) {
    return {
      restrict: 'E',
      templateUrl: 'template/datepicker/month.html',
      link: function(scope) {
        var ctrl = scope.$datepickerCtrl;

        ctrl.step = { years: 1 };

        ctrl._refreshView = function() {
          var months = new Array(12),
            year = ctrl.activeDate.getFullYear();

          for ( var i = 0; i < 12; i++ ) {
            months[i] = ctrl.createDateObject(new Date(Date.UTC(year, i, 1)), scope.formatMonth);
          }

          ctrl.firstDate = months[0].date;
          ctrl.lastDate = (function() {
            var lastDay = angular.copy(months[11].date);
            lastDay.setDate(31);
            return lastDay;
          })();
          scope.title = dateFilter(ctrl.activeDate, scope.formatMonthTitle);
          scope.rows = ctrl.split(months, 3);
        };

        ctrl.compare = function(date1, date2) {
          return Date.UTC( date1.getFullYear(), date1.getMonth() ) - Date.UTC( date2.getFullYear(), date2.getMonth() );
        };

        ctrl._onKeydown = function(key) {
          var candidateDate = angular.copy(ctrl.activeDate);
          var direction = 1;

          if (key === 'left') {
            candidateDate.setMonth(candidateDate.getMonth() - 1);
            direction = -1;
          } else if (key === 'up') {
            candidateDate.setMonth(candidateDate.getMonth() - 3);
            direction = -1;
          } else if (key === 'right') {
            candidateDate.setMonth(candidateDate.getMonth() + 1);
          } else if (key === 'down') {
            candidateDate.setMonth(candidateDate.getMonth() + 3);
          } else if (key === 'pageup') {
            candidateDate.setFullYear(candidateDate.getFullYear() - 1);
            direction = -1;
          } else if (key === 'pagedown') {
            candidateDate.setFullYear(candidateDate.getFullYear() + 1);
          } else if (key === 'home') {
            candidateDate.setMonth(0);
            direction = -1;
          } else if (key === 'end') {
            candidateDate.setMonth(11);
          }

          if(!ctrl.isMoveEnabled(direction, candidateDate)) {
            return;
          }

          ctrl.activeDate = candidateDate;
          ctrl._refreshView();
        };
        ctrl.refreshView();
      }
    };
  }])

  .directive('yearpicker', function () {
    return {
      restrict: 'E',
      templateUrl: 'template/datepicker/year.html',
      link: function(scope) {
        var ctrl = scope.$datepickerCtrl;

        var range = scope.yearRange;

        ctrl.step = { years: range };

        function getStartingYear( year ) {
          return parseInt((year - 1) / range, 10) * range + 1;
        }

        ctrl._refreshView = function() {
          var years = new Array(range);

          for ( var i = 0, start = getStartingYear(ctrl.activeDate.getFullYear()); i < range; i++ ) {
            years[i] = ctrl.createDateObject(new Date(Date.UTC(start + i, 0, 1)), scope.formatYear);
          }

          ctrl.firstDate = years[0].date;
          ctrl.lastDate = (function() {
            var lastDay = angular.copy(years[years.length - 1].date);
            lastDay.setMonth(11, 31);
            return lastDay;
          })();

          scope.title = [years[0].label, years[range - 1].label].join(' - ');
          scope.rows = ctrl.split(years, 5);
        };

        ctrl.compare = function(date1, date2) {
          return date1.getFullYear() - date2.getFullYear();
        };

        ctrl._onKeydown = function( key ) {
          var candidateDate = angular.copy(ctrl.activeDate);
          var direction = 1;

          if (key === 'left') {
            candidateDate.setFullYear(candidateDate.getFullYear() - 1);
            direction = -1;
          } else if (key === 'up') {
            candidateDate.setFullYear(candidateDate.getFullYear() - 5);
            direction = -1;
          } else if (key === 'right') {
            candidateDate.setFullYear(candidateDate.getFullYear() + 1);
          } else if (key === 'down') {
            candidateDate.setFullYear(candidateDate.getFullYear() + 5);
          } else if (key === 'pageup') {
            candidateDate.setFullYear(candidateDate.getFullYear() - ctrl.step.years);
            direction = -1;
          } else if (key === 'pagedown') {
            candidateDate.setFullYear(candidateDate.getFullYear() + ctrl.step.years);
          } else if (key === 'home') {
            direction = -1;
            candidateDate.setFullYear(getStartingYear(candidateDate.getFullYear()));
          } else if (key === 'end') {
            candidateDate.setFullYear(getStartingYear(candidateDate.getFullYear()) + range - 1);
          }

          if(!ctrl.isMoveEnabled(direction, candidateDate)) {
            return;
          }

          ctrl.activeDate = candidateDate;
          ctrl._refreshView();
        };

        ctrl.refreshView();
      }
    };
  });
