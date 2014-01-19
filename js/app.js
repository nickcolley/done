(function () {

  'use strict';

  function Todo(name) {
    this.storage = new app.Store(name);
    this.model = new app.Model(this.storage);
    this.template = new app.Template();
    this.view = new app.View(this.template);
    this.controller = new app.Controller(this.model, this.view);
  }

  var todo = new Todo('todos-vanillajs');

  window.addEventListener('load', function () {
    todo.controller.setView(document.location.hash);
  }.bind(this));
  window.addEventListener('hashchange', function () {
    todo.controller.setView(document.location.hash);
  }.bind(this));

  // This is a very quick and dirty sync setup

  // Update the UI whenever we see changes, this is gonna cause things
  // to refresh twice when you make a change, sorry
  todo.storage.db.changes({
    since: 'latest',
    continuous: true,
    onChange: function(change) {
      todo.controller.setView(document.location.hash);
      todo.controller._filter(true);
    }
  });

  // where is my db servive at
  var authHost = 'http://persona.pouchdb.com';

  function sync(url) {
    var opts = {continuous: true};
    todo.storage.db.replicate.to(url, opts);
    todo.storage.db.replicate.from(url, opts);
  }

  var loggedIn = function(result) {
    sync(result.dbUrl);
  };

  var loggedOut = function() {
    // Should probaby do something here
  };

  function simpleXhrSentinel(xhr) {
    return function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          var result = {};
          try {
            result = JSON.parse(xhr.responseText);
          } catch(e) {}
          loggedIn(result);
        } else {
          loggedOut();
          navigator.id.logout();
        }
      }
    };
  }

  function verifyAssertion(assertion) {
    var xhr = new XMLHttpRequest();
    var param = 'assert=' + assertion;
    xhr.open('POST', authHost + '/persona/sign-in', true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(param);
    xhr.onreadystatechange = simpleXhrSentinel(xhr);
  }

  function signoutUser() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", authHost + '/persona/sign-out', true);
    xhr.send(null);
    xhr.onreadystatechange = simpleXhrSentinel(xhr);
  }

  navigator.id.watch({
    onlogin: verifyAssertion,
    onlogout: signoutUser
  });

  var signinLink = document.getElementById('signin');
  var signoutLink = document.getElementById('signout');
  signinLink.onclick = function() { navigator.id.request(); };
  signoutLink.onclick = function() { navigator.id.logout(); };

})();
