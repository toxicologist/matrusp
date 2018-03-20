/**
 * A class representing lectures.
 * 
 * @Constructor
 *
 * @example
 *  var lectureExample = {
 *    code: "SCC0502",
 *    name: "Algoritmos e Estruturas de Dados I",
 *    color: "lightblue",
 *    campus: "TODOS",
 *    selected: 1,
 *    classrooms: [{@link Classroom}],
 *    htmlElement: div.lecture-info
 *  }
 *
 * @see UI#createLectureInfo
 */
 // IMPORTANT: the 'ui' variable must be already set up!
function Lecture(jsonObj, parentPlan) {
  this.parent = parentPlan;
  this.classrooms = new Array();
  this.selected = true;
  // activeClassroom is set after combinations are computed (last thing of creating a plan)
  this.activeClassroom = null;
  if (jsonObj) {
    this.code = jsonObj.codigo;
    this.name = jsonObj.nome;
    this.lectureCredits = jsonObj.creditos_aula;
    this.workCredits = jsonObj.creditos_trabalho;
    this.color = jsonObj.color;
    this.htmlElement = ui.createLectureInfo(this);
    this.htmlLectureCheckbox = this.htmlElement.getElementsByClassName('lecture-info-checkbox')[0];
    this.htmlLectureArrowUp = this.htmlElement.getElementsByClassName('lecture-info-up')[0];
    this.htmlLectureArrowDown = this.htmlElement.getElementsByClassName('lecture-info-down')[0];
    this.htmlClassroomsCheckbox = this.htmlElement.getElementsByClassName('classrooms-header-checkbox')[0];
    for (var i = 0; i < jsonObj.turmas.length; i++) {
      this.classrooms.push(new Classroom(jsonObj.turmas[i], this));
    }

    this.appendHTMLChildren();
    this.updateClassroomsCheckbox();
    this.addEventListeners();
  } else {
    this.code = null;
    this.name = null;
    this.color = null;
    this.campus = null;
    this.selected = null;
    this.htmlElement = null;
    this.htmlLectureCheckbox = null;
    this.htmlLectureArrowUp = null;
    this.htmlLectureArrowDown = null;
    this.htmlClassroomsCheckbox = null;
  }
}

/**
 *
 */
Lecture.prototype.appendHTMLChildren = function() {
  // this.htmlElement.children[1] is equivalent (30.jul.16)
  var classroomsDiv = this.htmlElement.getElementsByClassName('lecture-classrooms')[0];
  for (var i = 0; i < this.classrooms.length; i++) {
    classroomsDiv.appendChild(this.classrooms[i].htmlElement);
  }
}

/**
 *
 */
Lecture.prototype.numberOfClassroomsSelected = function() {
  var classroomsSelected = 0;
  for (var i = 0; i < this.classrooms.length; i++) {
    if (this.classrooms[i].selected) {
      classroomsSelected++;
    }
  }
  return classroomsSelected;
}

/**
 *
 */
Lecture.prototype.allClassroomsSelected = function() {
  return this.numberOfClassroomsSelected() == this.classrooms.length;
}

/**
 *
 */
Lecture.prototype.noClassroomsSelected = function() {
  return this.numberOfClassroomsSelected() == 0;
}

/**
 *
 */
Lecture.prototype.updateClassroomsCheckbox = function() {
  this.htmlClassroomsCheckbox.checked = this.allClassroomsSelected();
}

/**
 *
 */
Lecture.prototype.toggleLectureOpen = function() {
  toggleClass(this.htmlElement, 'lecture-open');
}

/**
 * 
 */
Lecture.prototype.lectureSelect = function() {
  this.stopAnimationLoop();
  this.selected = true;
  this.htmlLectureCheckbox.checked = true;
  if (this.noClassroomsSelected()) {
    this.htmlClassroomsCheckbox.checked = true;
    var shouldUpdate = false;
    this.updateAllClassroomsSelections(shouldUpdate);
  }
}

/**
 * 
 */
Lecture.prototype.lectureUnselect = function() {
  this.selected = false;
  this.htmlLectureCheckbox.checked = false;
}

/**
 * Callback to the 'click' event on the lecture checkbox;
 */
Lecture.prototype.toggleLectureSelection = function() {
  if (this.selected) {
    this.lectureUnselect();
  } else {
    this.lectureSelect();
  }
  this.parent.update();
}

/**
 *
 */
Lecture.prototype.enableCheckbox = function() {
  this.htmlLectureCheckbox.disabled = false;
}

/**
 *
 */
Lecture.prototype.disableCheckbox = function() {
  this.htmlLectureCheckbox.disabled = true;
}

/**
 *
 */
// TODO colocar um parametro shouldUpdate. Nao updatar quando clearing o plano.
Lecture.prototype.delete = function() {
  for (var i = 0; i < this.classrooms.length; i++) {
    this.classrooms[i].delete();
  }
  this.htmlElement.parentNode.removeChild(this.htmlElement);

  // All htmlElements removed, now remove itself from the plan and
  // update it.
  var indexOnParent = this.parent.lectures.indexOf(this);
  this.parent.lectures.splice(indexOnParent, 1);

  this.parent.update();
}

/**
 *
 */
Lecture.prototype.updateAllClassroomsSelections = function(shouldUpdate) {
  for (var i = 0; i < this.classrooms.length; i++) {
    if (this.classrooms[i].selected != this.htmlClassroomsCheckbox.checked) {
      var shouldUpdateFurther = false;
      this.classrooms[i].toggleClassroomSelection(shouldUpdateFurther);
    }
  }

  // creates a 'true' default value for 'shouldUpdate'
  shouldUpdate = (typeof shouldUpdate !== 'undefined') ? shouldUpdate : true;
  if (shouldUpdate) {
    this.update();
  }
}

/**
 *
 */
Lecture.prototype.update = function(classroomUpdated) {
  if (this.noClassroomsSelected()) {
    this.activeClassroom = null;
    this.lectureUnselect();
  } else if (this.allClassroomsSelected() || (classroomUpdated && classroomUpdated.selected)) {
    // When no classrooms were selected and right now at least one is, the lecture too
    // becomes selected. (Thinking about the use case where the user unchecks all
    // classrooms and then checks one back. I think the user wants that classroom
    // to be considered on the combinations.)
    this.lectureSelect();
  }
  this.updateClassroomsCheckbox();
  this.parent.update(classroomUpdated);
}

/**
 *
 */
Lecture.prototype.moveUp = function() {
  var lectureIndex = this.parent.lectures.indexOf(this);
  if (lectureIndex == 0) {
    return;
  }
  this.parent.lectures.splice(lectureIndex, 1);
  this.parent.lectures.splice(lectureIndex - 1, 0, this);

  // Updating the GUI
  var htmlParentElement = this.htmlElement.parentElement;
  var indexOnParent;
  for (var i = 0; i < htmlParentElement.children.length; i++) {
    if (htmlParentElement.children[i] == this.htmlElement) {
      indexOnParent = i;
      break;
    }
  }
  var htmlElementBefore = htmlParentElement.children[indexOnParent - 1];
  // this.htmlElement doesn't have to be removed because one element can
  // exist only in one place. So when reinserting it is automatically removed
  // from its original place.
  htmlParentElement.insertBefore(this.htmlElement, htmlElementBefore);

  this.parent.update();
}

/**
 *
 */
Lecture.prototype.moveDown = function() {
  var lectureIndex = this.parent.lectures.indexOf(this);
  if (lectureIndex == this.parent.lectures.length - 1) {
    return;
  }
  this.parent.lectures[lectureIndex + 1].moveUp();
}

Lecture.prototype.showNextClassroom = function() {
  var currentClassroomIndex = 0;
  for (var i = 0; i < this.classrooms.length; i++) {
    var classroomHtmlBoxExample = this.classrooms[i].schedules[0].htmlElement;
    if (hasClass(classroomHtmlBoxExample, 'schedule-box-show')) {
      this.classrooms[i].hideBox();
      this.classrooms[i].unsetConflict();
      currentClassroomIndex = i;
      break;
    }
  }

  var nextClassroomIndex = (currentClassroomIndex + 1) % this.classrooms.length;
  this.classrooms[nextClassroomIndex].showBox();
  this.classrooms[nextClassroomIndex].checkAndSetConflict();
}

Lecture.prototype.animationLoopShowEachClassroom = function() {
  this.classrooms[0].showBox();
  this.classrooms[0].checkAndSetConflict();
  if (!this.hoverAnimationIntervals) {
    // I still don't know why, but more than one interval were being
    // created when moving lectures up/down or clicking 
    // (on unchecked checkbox but active one (bug).
    // To reproduce: change here to not be an array anymore, 
    // put two lectures that conflict (every two classrooms)
    // unselect both, select the one on top and see that the checkbox on the
    // other one is still active, although unchecked. Click on it.)
    // or 
    this.hoverAnimationIntervals = Array();
  }
  var newIntervalId = setInterval(this.showNextClassroom.bind(this), 1000);
  this.hoverAnimationIntervals.push(newIntervalId);
}

// side-effect: hides all boxes! Should be called before something like
// plan.update to, in the end, show the selected boxes.
Lecture.prototype.stopAnimationLoop = function() {
  if (!this.hoverAnimationIntervals) {
    return;
  }
  while (this.hoverAnimationIntervals.length > 0) {
    clearInterval(this.hoverAnimationIntervals[0]);
    // remove first element of array
    this.hoverAnimationIntervals.splice(0, 1);
  }

  for (var i = 0; i < this.classrooms.length; i++) {
    // Hide pending boxes. Probably, clearIntervals was called
    // while one classroom was being displayed.
    this.classrooms[i].hideBox();
    this.classrooms[i].unsetConflict();
  }
}

Lecture.prototype.setHighlight = function() {
  for (var i = 0; i < this.classrooms.length; i++) {
    this.classrooms[i].addClassInSchedules('schedule-box-highlight');
  }

  if (!this.selected) {
    this.animationLoopShowEachClassroom();
  }
};

Lecture.prototype.unsetHighlight = function() {
  for (var i = 0; i < this.classrooms.length; i++) {
    this.classrooms[i].removeClassInSchedules('schedule-box-highlight');
  }

  if (!this.selected) {
    this.stopAnimationLoop();
  }
};


/**
 *
 */
Lecture.prototype.addEventListeners = function() {
  this.htmlElement.addEventListener('mouseenter', this.setHighlight.bind(this));
  this.htmlElement.addEventListener('mouseleave', this.unsetHighlight.bind(this));

  var lectureHeaderTitle = this.htmlElement.getElementsByClassName('lecture-info-header-title')[0];
  lectureHeaderTitle.addEventListener('click', this.toggleLectureOpen.bind(this));
  
  var lectureHeaderDelete = this.htmlElement.getElementsByClassName('lecture-info-delete')[0];
  lectureHeaderDelete.addEventListener('click', this.delete.bind(this));

  this.htmlLectureCheckbox.addEventListener('click', this.toggleLectureSelection.bind(this));

  this.htmlClassroomsCheckbox.addEventListener('click', this.updateAllClassroomsSelections.bind(this));

  this.htmlLectureArrowUp.addEventListener('click', this.moveUp.bind(this));
  this.htmlLectureArrowDown.addEventListener('click', this.moveDown.bind(this));
};

Lecture.prototype.safeCopy = function () {
  var copy = {};
  copy.codigo = jsonObj.code;
  copy.nome = jsonObj.name;
  copy.color = jsonObj.color;

  copy.classrooms = [];
  for(var classroom in this.classrooms) {
    copy.classrooms.push(classroom.safeCopy());
  }
}







