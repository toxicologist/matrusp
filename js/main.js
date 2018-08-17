if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceworker.js');
  navigator.serviceWorker.addEventListener('message', e => {
    ui.showBanner("Uma atualização está disponível. <a href=''>Atualize a página</a> para aplicar.");
  });
}

var dbworker = new Worker("js/dbupdate.js");

var state;
var searchBox;
var courseBox;
var matrusp_current_state_version = 7;

state = new State();
ui = new UI();
searchBox = new SearchBox();
courseBox = new CourseBox();

dbworker.onmessage = e => {
  ui.setLoadingBar(e.data);
  if (e.data == 1) {
    searchBox.populateOptions();
  }
}

if (window.location.hash.substr(1)) {
  ui.loadStateFromServer(window.location.hash.substr(1));
  history.pushState('', document.title, window.location.pathname);
} else if (localStorage.getItem('state')) {
  state.load(JSON.parse(localStorage.getItem('state')));
  state.saveOnLocalStorage();
}
else state.clear();
setTimeout(function() { ui.scrollActiveCombinationToView() }, 100);