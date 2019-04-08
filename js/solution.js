'use strict';

//todo:resize!

class Common {
  //ф-ия для работы с классами
  actionsClass(action, nodeElement, className, force) {
    switch (action) {
      case "add":
        nodeElement.classList.add(className);
        break;
      case "remove":
        nodeElement.classList.remove(className);
        break;
      case "toggle":
        force ? nodeElement.classList.toggle(className, force) : nodeElement.classList.toggle(className);
        break;
      case "contains":
        return nodeElement.classList.contains(className);
    }
  }

//ф-ия для работы с аттрибутами DOM элемента
  actionsAttribute(action, nodeElement, attrName, value = '') {
    switch (action) {
      case "set":
        nodeElement.setAttribute(attrName, value);
        break;
      case "get":
        nodeElement.getAttribute(attrName);
        break;
      case "remove":
        nodeElement.removeAttribute(attrName);
        break;
      case "has":
        return nodeElement.hasAttribute(attrName);
    }
  }

  throttle(callback) {
    let isWaiting = false;
    return function () {
      if (!isWaiting) {
        callback.apply(this, arguments);
        isWaiting = true;
        requestAnimationFrame(() => {
          isWaiting = false;
        });
      }
    }
  }

  debounce(callback, delay) {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        timeout = null;
        callback();
      }, delay);
    };
  };

}


class Menu extends Common {
  constructor(id) {
    super();
    this.movedMenuDrag = null;
    this.shiftX = 0;
    this.shiftY = 0;
    this.menu = document.querySelector('.menu');
    this.menuDrag = this.menu.querySelector('.drag');
    this.menuBurger = this.menu.querySelector('.burger');
    this.menuNew = this.menu.querySelector('.new');
    this.menuComments = this.menu.querySelector('.comments');
    this.menuCommentsTools = this.menu.querySelector('.comments-tools');
    this.menuDraw = this.menu.querySelector('.draw');
    this.menuDragTools = this.menu.querySelector('.draw-tools');
    this.menuShare = this.menu.querySelector('.share');
    this.menuShareTools = this.menu.querySelector('.share-tools');
    this.imageState = 'new';
    this.id = id;
    this.init();
  }

  //добавляем draggable для работы с Drag&Drop API
  draggable(nodeElement) {
    this.actionsClass('add', nodeElement, 'menuDrag');
    //Common.actionsAttribute('set', nodeElement, 'draggable');
  }

  //добавление обработчиков
  init() {
    //навешиваем классы/аттрибуты на передвигаемый элемент (меню)
    this.draggable(this.menu);

    //для работы с мышью на перетаскивание элемента (меню)
    this.menuDrag.addEventListener('mousedown', this.dragStart.bind(this));
    this.menuDrag.addEventListener('mousemove', event => this.drag(event, event.pageX, event.pageY));
    this.menuDrag.addEventListener('mouseup', this.drop.bind(this));

    //события для работы с тач
    this.menuDrag.addEventListener('touchstart', event => this.dragStart(event.touches[0]));
    this.menuDrag.addEventListener('touchmove', event => this.drag(event, event.touches[0].pageX, event.touches[0].pageY));
    this.menuDrag.addEventListener('touchend', event => this.drop(event.touches[0]));

    this.menuBurger.addEventListener('click', () => {
      this.selectedMenu('burger');
    });

    this.menuShare.addEventListener('click', () => this.selectedMenu('share'))

    this.menuShareTools.addEventListener('click', this.onShare.bind(this));
    const copyBtn = this.menuShareTools.querySelector('.menu_copy');
    copyBtn.addEventListener('click', this.onCopy.bind(this));

    //событие при клике на кнопки меню
    this.menuNew.addEventListener('click', this.newImage.bind(this));

    //состояние меню по-умолчанию
    this.selectedMenu('new');

    //добавляем невидимый input
    const inputFile = this.createInputElement();
    this.actionsClass('add', inputFile, 'menu__file-input');
    inputFile.style.width = window.getComputedStyle(this.menuNew).width;
    this.menuNew.appendChild(inputFile);

    if (localStorage.length !== 0) {
      const position = this.getMenuPosition();
      this.menu.style.left = position.left;
      this.menu.style.top = position.top;
    }

  }

  //создаём input type='file' для нативной загрузки картинки
  createInputElement() {
    const inputFile = document.createElement('input');
    inputFile.setAttribute('type', 'file');
    inputFile.style.opacity = '0';
    inputFile.style.position = 'absolute';
    inputFile.style.height = '100%';
    inputFile.style.top = '0';
    inputFile.style.left = '0';
    inputFile.setAttribute('accept', 'image/jpeg, image/png, image/jpg');
    return inputFile;
  }

  //начало перетаскивания меню
  dragStart(event) {
    if (this.actionsClass('contains', this.menu, 'menuDrag')) {
      this.movedMenuDrag = this.menu;
    }
    event.preventDefault();
    const bounds = event.target.getBoundingClientRect();
    this.shiftX = event.pageX - bounds.left -
      window.pageXOffset;
    this.shiftY = event.pageY - bounds.top -
      window.pageYOffset;
  }

  //само перетаскивание
  drag(event, x, y) {
    if (!this.movedMenuDrag) {
      return;
    }
    event.preventDefault();

    x = x - this.shiftX;
    y = y - this.shiftY;

    const
      minX = document.documentElement.offsetLeft,
      minY = document.documentElement.offsetTop,
      maxX = document.documentElement.offsetLeft + document.documentElement.offsetWidth -
        this.menu.offsetWidth - 2,
      maxY = document.documentElement.offsetTop + document.documentElement.offsetHeight -
        this.menu.offsetHeight - 2;
    x = Math.min(x, maxX);
    y = Math.min(y, maxY);
    x = Math.max(x, minX);
    y = Math.max(y, minY);


    this.movedMenuDrag.style.left = `${x}px`;
    this.movedMenuDrag.style.top = `${y}px`;
    this.actionsClass('add', this.movedMenuDrag, 'moving');
  };


  //окончание перетаскивания меню
  drop() {
    if (!this.movedMenuDrag) {
      return;
    }
    //event.preventDefault();
    this.actionsClass('remove', this.movedMenuDrag, 'moving');
    this.saveMenuPosition({left: this.movedMenuDrag.style.left, top: this.movedMenuDrag.style.top});
    this.movedMenuDrag = null;

  }

  //click "Загрузить новое"
  newImage(event) {
    this.selectedMenu('new');
  }

  onShare() {
    const shareUrl = this.menuShareTools.querySelector('.menu__url');
    const sharedHref = location.hash.length > 1 ? `${location.href}` : `${location.href}#${this.id}`;
    this.actionsAttribute('set', shareUrl, 'value', sharedHref);
  }

  onCopy() {
    const menuUrl = this.menu.querySelector('.menu__url');
    navigator.clipboard.writeText(menuUrl.value)
      .then(() => {
        //copy
      })
      .catch(err => {
        console.log('Something went wrong', err);
      });

  }

  onBurgerClick() {
    if (this.state.split('-')[1]) {
      this.state = this.state.split('-')[0];
      this.selectedMenu(this.state);
    } else {
      this.menuBurger.style.display = 'inline-block';
      const menuLine = this.menu.querySelectorAll('.menu[data-state="selected"] > .mode ');
      Array.from(menuLine).map(elem => elem.style.display = 'inline-block');
      this.state = `${this.state}-burger`;
    }
  }

  selectedMenu(modeName, id = this.id) {
    if ((id !== this.id)) {
      this.id = id;
    }
    this.menu.dataset.state = 'selected';
    switch (modeName) {
      case 'new':
        this.clearSelectedMenu();
        this.menuBurger.style.display = 'none';
        this.menuNew.dataset.state = 'selected';
        this.menuNew.style.display = 'inline-block';
        this.state = 'new';
        break;
      case 'comments':
        this.clearSelectedMenu();
        this.menuComments.style.display = 'inline-block';
        this.menuComments.dataset.state = 'selected';
        this.state = 'comments';
        break;
      case 'draw':
        this.clearSelectedMenu();
        this.menuDraw.style.display = 'inline-block';
        this.menuDraw.dataset.state = 'selected';
        this.state = 'draw';
        break;
      case 'share':
        this.clearSelectedMenu();
        this.menuShare.style.display = 'inline-block';
        this.menuShare.dataset.state = 'selected';
        this.state = 'share';
        this.onShare(id);
        break;
      case 'burger':
        this.clearSelectedMenu();
        this.onBurgerClick();
        break;
    }
  }

  clearSelectedMenu() {
    this.menuShare.dataset.state = '';
    this.menuShare.style.display = 'none';
    this.menuComments.dataset.state = '';
    this.menuComments.style.display = 'none';
    this.menuDraw.dataset.state = '';
    this.menuDraw.style.display = 'none';
    this.menuNew.dataset.state = '';
    this.menuNew.style.display = 'none';
    this.menuBurger.style.display = 'inline-block';
  }

  saveMenuPosition(position) {
    localStorage.position = JSON.stringify(position);
  }

  getMenuPosition() {
    try {
      return JSON.parse(localStorage.position);
    } catch (e) {
      return null;
    }
  }
}


class Draw extends Common {
  constructor() {
    super();
    this.init();
    this.state = 'wait';
  }

  init() {
    //создаём элемент canvas
    const canvas = document.createElement('canvas');
    if (canvas) {
      this.canvas = canvas;
    }
    this.setColor();
    this.actionsClass('add', canvas, 'canvas');
    const app = document.querySelector('.app');
    const img = document.querySelector('.current-image');
    const imgPosition = img.getBoundingClientRect();
    canvas.width = imgPosition.width;
    canvas.height = imgPosition.height;
    canvas.style.width = `${imgPosition.width}px`;
    canvas.style.height = `${imgPosition.height}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${imgPosition.left}px`;
    canvas.style.top = `${imgPosition.top}px`;
    canvas.style.zIndex = '3';
    this.blankDataUrl = canvas.toDataURL();
    app.appendChild(canvas);

    //задаём контекст 2Д
    this.ctx = canvas.getContext("2d");
    this.lastX = undefined;
    this.lastY = undefined;

    this.draw = this.draw.bind(this);
  }

  //функция очищения экрана
  canvasClear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setColor(color) {
    switch (color) {
      case 'red':
        this.color = '#ea5d56';
        break;
      case 'yellow':
        this.color = '#f3d135';
        break;
      case 'blue':
        this.color = '#53a7f5';
        break;
      case 'purple':
        this.color = '#b36ade';
        break;
      case 'green':
      default:
        this.color = '#6cbe47';
        break;
    }
  }

  draw(event) {
    this.ctx.beginPath();
    this.ctx.moveTo(event.offsetX, event.offsetY);
    this.ctx.fillStyle = this.color;
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = '4px';
    this.ctx.lineJoin = "round";
    this.ctx.lineCap = "round";

    if (this.lastX && this.lastY) {
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(event.offsetX, event.offsetY);
      this.ctx.stroke();
    }

    this.ctx.closePath();
    [this.lastX, this.lastY] = [event.offsetX, event.offsetY];
  }

  setState(state) {
    if (state === this.state) {
      return;
    }
    this.state = state;
    if (state === 'draw') {
      this.canvas.addEventListener("mousedown", this.toDraw.bind(this));
      //Если кнопка мыши отпущена, то линия не рисуется
      this.canvas.addEventListener("mouseup", this.noDraw.bind(this));
      //Если мышь вышла за пределы холста и потом вернулась, линия не рисуется
      this.canvas.addEventListener("mouseleave", this.noDraw.bind(this));
    }
    if (state === 'wait') {
      this.canvas.removeEventListener("mousedown", this.toDraw.bind(this));
      this.canvas.removeEventListener("mouseup", this.noDraw.bind(this));
      //todo: при потере не делать соединительной линии
      this.canvas.removeEventListener("mouseleave", this.noDraw.bind(this));
    }
  }

  toDraw(event) {
    this.state === 'draw';
    this.canvas.style.zIndex = '4';
    this.canvas.addEventListener("mousemove", this.draw);
  }

  noDraw() {
    this.state === 'wait';
    this.canvas.style.zIndex = '3';
    this.canvas.removeEventListener("mousemove", this.draw);
    this.lastX = undefined;
    this.lastY = undefined;
  }

  getPic() {
    //сравнение с пустым канвасом. Есл равны, то измнений нет
    if (this.canvas.toDataURL() == this.blankDataUrl) {
      return;
    }

    /*todo: проверка blob
    this.canvas.toBlob(blob => {
      const newImg = document.createElement('img'),
        url = URL.createObjectURL(blob);

      newImg.onload = function () {
        // no longer need to read the blob so it's revoked
        URL.revokeObjectURL(url);
      };

      newImg.src = url;
      const app = document.querySelector('.app');
      if (app) {
        document.body.appendChild(newImg);
      }
    });
  */
    return this.canvas;
  }


  renderImg(url) {
    const newImg = document.createElement('img');
    newImg.src = url;
    newImg.style.zIndex = '2';
    newImg.style.position = 'absolute';
    newImg.style.top = '50%';
    newImg.style.left = '50%';
    newImg.style.transform = 'translate(-50%, -50%)';
    newImg.style.pointerEvents = 'none';
    newImg.style.userSelect = 'none';

    const app = document.querySelector('.app');
    if (app) {
      app.appendChild(newImg);
    }
    return newImg;
  }
}


class Mask extends Common {
  constructor() {
    super();
  }

  loadMask(url) {
    if (!url) {
      return;
    }
    const img = document.querySelector('.mask');
    if (img) {
      img.src = url;
      return new Promise((resolve, reject) => {
        img.addEventListener('load', () => {
          resolve();
        });
      });
    }
    const newImg = document.createElement('img');
    this.actionsClass('add', newImg, 'mask');
    this.actionsAttribute('set', newImg, 'alt', 'mask');
    newImg.src = url;
    newImg.style.zIndex = '2';
    newImg.style.position = 'absolute';
    newImg.style.top = '50%';
    newImg.style.left = '50%';
    newImg.style.transform = 'translate(-50%, -50%)';
    newImg.style.pointerEvents = 'none';
    newImg.style.userSelect = 'none';

    const app = document.querySelector('.app');
    app.appendChild(newImg);
    return new Promise((resolve, reject) => {
      newImg.addEventListener('load', () => {
        resolve();
      });
    });
  }

  clearMask() {
    const app = document.querySelector('.app');
    const mask = document.querySelector('.mask');
    if (mask) {
      app.removeChild(mask);
    }
  }
}


class Comments extends Common {
  constructor(id) {
    super();
    this.url = `https://neto-api.herokuapp.com/pic`;
    this.id = id;
  }

  setId(id) {
    this.id = id;
  }

  sendComments(comment) {
    const message = `message=${comment.message}&left=${parseInt(comment.left)}&top=${parseInt(comment.top)}`;
    (async () => {
      const rawResponse = await fetch(`${this.url}/${this.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: message,
      });
      try {
        const content = await rawResponse.json();

        const imgPosition = document.querySelector('.current-image').getBoundingClientRect();
        if (imgPosition) {
          this.hideLoader(imgPosition.left + parseInt(comment.left), parseInt(imgPosition.top) + parseInt(comment.top));
        }
      } catch (e) {
        this.hideLoader(comment.left, comment.top);
        console.log(e);
      }
    })();
  }

  hideLoader(left, top) {
    const loaders = document.querySelectorAll('.loader');
    loaders.forEach(loader => {
      const element = loader.parentNode.parentNode.parentNode;
      if ((parseInt(element.style.left) === left) && (parseInt(element.style.top) === top)) {
        loader.style.display = 'none';
      }
    })
  }

  newComment(parent, left, top) {
    this.closeAllComments();
    const comment = this.createTemplate();
    const img = document.querySelector('.current-image');
    const imgPosition = img.getBoundingClientRect();

    const leftComment = parseInt(imgPosition.left) + left;
    const topComment = imgPosition.top + top;
    comment.style.left = `${parseInt(leftComment)}px`;
    comment.style.top = `${parseInt(topComment)}px`;
    comment.style.zIndex = '3';


    parent.appendChild(comment);
    if (!parent.classList) {
      const markerCheckbox = comment.querySelector('.comments__marker-checkbox');
      if (markerCheckbox) {
        markerCheckbox.checked = false;
      }
    }
    //todo: может и ну нужно
    return parent;
  }

  createTemplate() {

    //todo: рефактор для appendChild (через reduce, для быстродействия)

    const commentsForm = document.createElement('form');
    this.actionsClass('add', commentsForm, 'comments__form');

    const commentsMarker = document.createElement('span');
    this.actionsClass('add', commentsMarker, 'comments__marker');

    const commentsMarkerCheckbox = document.createElement('input');
    this.actionsClass('add', commentsMarkerCheckbox, 'comments__marker-checkbox');
    this.actionsAttribute('set', commentsMarkerCheckbox, 'type', 'checkbox');
    commentsMarkerCheckbox.checked = true;
    commentsMarkerCheckbox.addEventListener('change', () => {
      if (!commentsMarkerCheckbox.checked) {
        commentsMarkerCheckbox.checked = true;
        commentsForm.style.zIndex = '4';
      } else {
        this.closeAllComments();
        commentsForm.style.zIndex = '4';
        commentsMarkerCheckbox.checked = true;
      }
    });

    const commentsBody = document.createElement('div');
    this.actionsClass('add', commentsBody, 'comments__body');

    const commentsInput = document.createElement('textarea');
    this.actionsClass('add', commentsInput, 'comments__input');
    this.actionsAttribute('set', commentsInput, 'placeholder', 'Напишите ответ...');
    this.actionsAttribute('set', commentsInput, 'type', 'text');

    const commentsClose = document.createElement('input');
    this.actionsClass('add', commentsClose, 'comments__close');
    this.actionsAttribute('set', commentsClose, 'type', 'button');
    this.actionsAttribute('set', commentsClose, 'value', 'Закрыть');
    commentsClose.addEventListener('click', this.closeComment.bind(this));

    const commentsSubmit = document.createElement('input');
    this.actionsClass('add', commentsSubmit, 'comments__submit');
    this.actionsAttribute('set', commentsSubmit, 'type', 'button');
    this.actionsAttribute('set', commentsSubmit, 'value', 'Отправить');
    commentsSubmit.addEventListener('click', this.submitComment.bind(this));

    const comment = document.createElement('div');
    this.actionsClass('add', comment, 'comment');

    const loader = document.createElement('div');
    this.actionsClass('add', loader, 'loader');

    for (let i = 0; i < 5; i++) {
      loader.appendChild(document.createElement('span'));
    }

    loader.style.display = 'none';

    comment.appendChild(loader);

    commentsBody.appendChild(comment);
    commentsBody.appendChild(commentsInput);
    commentsBody.appendChild(commentsClose);
    commentsBody.appendChild(commentsSubmit);

    commentsForm.appendChild(commentsMarker);
    commentsForm.appendChild(commentsMarkerCheckbox);
    commentsForm.appendChild(commentsBody);

    return commentsForm;
  }

  addCommentToBody(timestamp, message) {
    const comment = document.createElement('div');
    this.actionsClass('add', comment, 'comment');

    const commentTime = document.createElement('p');
    const dateTime = this.parseTimestamp(timestamp);
    this.actionsClass('add', commentTime, 'comment__time');
    commentTime.textContent = dateTime;

    const arrayStringMessage = message.split('\n');
    const messageFragment = document.createDocumentFragment();
    arrayStringMessage.forEach(messagePart => {
      const commentMessage = document.createElement('p');
      this.actionsClass('add', commentMessage, 'comment__message');
      commentMessage.textContent = messagePart;
      messageFragment.appendChild(commentMessage);
    });
    comment.appendChild(commentTime);
    comment.appendChild(messageFragment);

    return comment;
  }

  parseTimestamp(timestamp) {
    const date = new Date();
    date.setTime(timestamp);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return date.toLocaleDateString('ru-RU', options);
  }


  renderComments(comments) {
    const commentsKeys = Object.keys(comments),
      commentsArray = [];

    commentsKeys.forEach(key => {
      commentsArray.push(comments[key]);
    });
    const threads = this.parseToThread(commentsArray);
    threads.forEach(thread => {
      const fragment = document.createDocumentFragment();

      this.newComment(fragment, thread[0].left, thread[0].top);
      const commentsBody = fragment.querySelector('.comments__body');

      //добавление треда
      thread.forEach(comment => {
        const commentsInput = commentsBody.querySelector('.comments__input');
        commentsBody.insertBefore(this.addCommentToBody(comment.timestamp, comment.message), commentsInput.previousElementSibling);
      });

      const commentsOn = document.querySelector('#comments-on'),
        commentsOff = document.querySelector('#comments-off'),
        commentsForm = fragment.querySelector('.comments__form');

      if (commentsOn.checked) {
        commentsForm.style.display = 'initial';
      }

      if (commentsOff.checked) {
        //комментарии выключены
        commentsForm.style.display = 'none';
      }
      document.querySelector('.app').appendChild(commentsForm);
    })
  }

//добавить в тред или создать коммент (если нет треда)
  renderComment(comment) {

    const commentsForms = document.querySelectorAll('.comments__form'),
      imgPosition = document.querySelector('.current-image').getBoundingClientRect();

    let thread;
    Array.from(commentsForms).some(form => {
      if ((parseInt(form.style.left) === parseInt(imgPosition.left + comment.left)) && (parseInt(form.style.top) === imgPosition.top + comment.top)) {
        thread = form;
        return true;
      }
    });

    const fragment = document.createDocumentFragment();
    if (!thread) {
      this.newComment(fragment, comment.left, comment.top);
    }
    const commentsBody = thread ? thread.querySelector('.comments__body') : fragment.querySelector('.comments__body'),
      commentsInput = commentsBody.querySelector('.comments__input'),
      commentsOn = document.querySelector('#comments-on'),
      commentsOff = document.querySelector('#comments-off'),
      commentsForm = thread ? thread : fragment.querySelector('.comments__form');

    commentsInput.value = '';
    const elem = commentsInput.previousElementSibling;
    commentsBody.insertBefore(this.addCommentToBody(comment.timestamp, comment.message), elem);

    if (commentsOn.checked) {
      commentsForm.style.display = 'initial';
    }

    if (commentsOff.checked) {
      commentsForm.style.display = 'none';
    }

    if (!thread) {
      document.querySelector('.app').appendChild(commentsForm);
    }
  }


  /*
  вход - массив комментов,
  коммент - объект {left, top, message, timestamp}
   */
  parseToThread(comments) {

    //todo: что-то очень плохо, нужно оптимизировать
    const threadArray = [];
    const firstThread = [];
    firstThread.push(comments[0]);
    threadArray.push(firstThread);
    for (let i = 1; i < comments.length; i++) {
      //threadLoop:
        for (let j = 0; j < threadArray.length; j++) {
        if ((comments[i].left === threadArray[j][0].left) && (comments[i].top === threadArray[j][0].top)) {
          if (comments[i].timestamp !== threadArray[j][0].timestamp) {
            threadArray[j].push(comments[i]);
          }
        } else {
          if (j === threadArray.length - 1) {
            const nextThread = [];
            nextThread.push(comments[i]);
            threadArray.push([comments[i]]);
          }
        }
      }
    }
    return threadArray;
  }


  closeComment(event) {
    const form = event.target.parentNode.parentNode;
    this.closeOrRemoveMarker(form);
  }

  submitComment(event) {
    const commentsBody = event.target.parentNode,
      commentsForm = commentsBody.parentNode,
      loader = commentsBody.querySelector('.loader');

    loader.style.display = 'initial';

    const position = window.getComputedStyle(commentsForm),
      img = document.querySelector('.current-image'),
      imgPosition = img.getBoundingClientRect(),
      textarea = commentsBody.querySelector('.comments__input'),
      comment = {
        message: textarea.value,
        left: `${parseInt(position.left) - imgPosition.left}`,
        top: `${parseInt(position.top) - imgPosition.top}`,
      };

    this.sendComments(comment);
  }

  closeAllComments() {
    const commentsForms = document.querySelectorAll('.comments__form');
    commentsForms.forEach(form => {
      this.closeOrRemoveMarker(form);
    })

  }

  closeOrRemoveMarker(form) {
    const markerCheckbox = form.querySelector('.comments__marker-checkbox');
    const comments = form.querySelectorAll('.comment');
    if (markerCheckbox) {
      if (comments.length === 1) {
        //удаляем форму нового комментария, если закрываем форму
        const app = document.querySelector('.app');
        app.removeChild(form);
      } else {
        //закрываем комментарии, осталяя метку
        markerCheckbox.checked = false;
        form.style.zIndex = '3';
      }
    }
  }

  removeComments() {
    const app = document.querySelector('.app');
    const comments = document.querySelectorAll('.comments__form');
    Array.from(comments).forEach((form) => {
      app.removeChild(form);
    })
  }

  hideMarks() {
    const forms = document.querySelectorAll('.comments__form');
    forms.forEach(form => {
      form.style.visibility = 'hidden';
    })
  }

  showMarks() {
    const forms = document.querySelectorAll('.comments__form');
    forms.forEach(form => {
      form.style.visibility = 'initial';
    })
  }
}

class App
  extends Common {
  //ловим всплытие от клика на меню
  constructor() {
    super();
    this.app = document.querySelector('.app');
    this.menu = new Menu();
    this.error = this.app.querySelector('.error');
    //state='new' || 'work' ||'error' || 'load'
    this.state = 'new';
    this.imageLoader = this.app.querySelector('.image-loader');
    this.id = null;
    this.draw = new Draw();
    this.mask = new Mask();
    this.arrayCanvas = [];
    this.arrayImage = [];
    this.init();
  }

  init() {
    this.clearCanvas();
    const hash = window.location.hash;

    if (hash.length > 1) {
      this.id = hash.slice(1);
      this.getImage(this.id);
      this.menu.selectedMenu('comments', this.id);
      this.state = 'comments';
    }

    //если обновление в этом же окне восстановим картинку
    const sessionDataId = sessionStorage.getItem('id');
    if (sessionDataId) {
      this.getImage(sessionDataId);
      this.setState('share', sessionDataId);
    }

    document.addEventListener('change', this.changeEvent.bind(this));
    this.app.addEventListener('click', this.clickApp.bind(this));
    this.app.addEventListener('drop', this.fileDrop.bind(this));
    this.app.addEventListener('dragover', event => event.preventDefault());

    this.comments = new Comments(this.id);
    this.comments.removeComments();

    if (this.id) {
      this.initNetwork();
    }

    this.timer = setInterval(() => {
      const pic = this.draw.getPic();

      if (pic) {
        const url = pic.toDataURL();

        this.arrayCanvas.push(this.draw.renderImg(url));

        pic.toBlob(blob => this.connection.send(blob));

        this.draw.canvasClear();
      }
    }, 2000);
  }

  initNetwork() {
    this.connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${this.id}`);
    this.connection.addEventListener('message', this.parseMessage.bind(this));
    this.connection.addEventListener('close', event => {
      console.log('Вебсокет-соединение закрыто');
    });
    this.connection.addEventListener('error', error => {
      console.log(`Произошла ошибка: ${error.data}`);
    });
    window.addEventListener('beforeunload', () => {
      this.connection.close()
    });
  }

  changeEvent(event) {
    //todo: скрытие комментариев
    if (this.actionsClass('contains', event.target, 'menu__toggle')) {
      const commentsOn = document.querySelector('#comments-on');
      const commentsOff = document.querySelector('#comments-off');

      if (commentsOn.checked) {
        this.comments.showMarks();
      }
      if (commentsOff.checked) {
        this.comments.closeAllComments();
        this.comments.hideMarks();
      }
    }

    const files = event.target.files;

    if (files) {
      this.clearCanvas();
      this.publicImage(files[0]);
    }

    if (this.actionsClass('contains', event.target, 'menu__color')) {
      this.draw.setColor(event.target.value);
    }
  }

  clickApp(event) {
    const elementMenu = (this.actionsClass('contains', event.target, 'menu__item'))
      ? event.target : (this.actionsClass('contains', event.target.parentNode, 'menu__item'))
        ? event.target.parentNode : null;

    if (elementMenu) {

      if (this.actionsClass('contains', elementMenu, 'comments')) {
        this.setState('comments');
        //this.menu.selectedMenu('comments');
        return;
      }
      if (this.actionsClass('contains', elementMenu, 'draw')) {
        this.setState('draw');
        return;
      }
      if (this.actionsClass('contains', elementMenu, 'share')) {
        this.setState('share');
        return;
      }
      if (this.actionsClass('contains', elementMenu, 'burger')) {
        return;
      }
      if (this.actionsClass('contains', elementMenu, 'drag')) {
        return;
      }
    }

    const findClassByClassList = (classList, className) => Array.from(classList).some(classNode => {
      return classNode.indexOf(className) === -1 ? false : true;
    });

    //пропускаем клики на меню
    //пропускаем случайные клики на форме комментариев
    let classList = event.target.classList,
      isElementComment = findClassByClassList(classList, 'comment'),
      isElementMenu = findClassByClassList(classList, 'menu');

    if (isElementComment) {
      return;
    }
    if (isElementMenu) {
      return;
    }

    classList = event.target.parentElement.classList;
    isElementComment = findClassByClassList(classList, 'comment');
    isElementMenu = findClassByClassList(classList, 'menu');

    if (isElementComment) {
      return;
    }
    if (isElementMenu) {
      return;
    }


    if (this.state === 'comments') {
      const img = this.app.querySelector('.current-image'),
        imgPosition = img.getBoundingClientRect(),
        left = event.clientX - imgPosition.left,
        top = event.clientY - imgPosition.top;
      this.comments.newComment(this.app, left, top);
    }

    if (this.state === 'draw') {
      //todo: вынести в init class App
      this.draw.setState('draw');
    } else {
      this.draw.setState('wait');
    }
  }


  clearCanvas() {
    this.error.style.display = 'none';
    const oldImage = this.app.querySelector('.current-image');
    if (oldImage) {
      this.app.removeChild(oldImage);
    }
    if (this.state === 'error') {
      const oldError = this.app.querySelector('.error-repeat-load');
      if (oldError) {
        this.app.removeChild(oldError);
      }
      const networkError = this.app.querySelector('.error-network');
      if (networkError) {
        this.app.removeChild(networkError);
      }
    }
  }

  updateImage(url, data = {}) {
    const img = document.createElement('img');
    this.actionsClass('add', img, 'current-image');
    img.src = url;
    //запрет на выделение и таскание фонового изображения
    img.style.pointerEvents = 'none';
    img.style.userSelect = 'none';
    img.style.zIndex = '1';

    this.app.appendChild(img);

    return new Promise((resolve, reject) => {
      img.addEventListener('load', () => {
        resolve(data);
      });
    });
  }

  fileDrop(event) {
    event.preventDefault();
    if (this.state !== 'new') {
      this.state = 'error';
      const newError = this.error.cloneNode(true);
      newError.style.display = 'initial';
      this.actionsClass('add', newError, 'error-repeat-load');
      const errorMessage = newError.querySelector('.error__message');
      errorMessage.textContent = 'Чтобы загрузить новое изображение, пожалуйста, восползуйтесь пунктом «Загрузить новое» в меню'
      this.app.appendChild(newError);
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    const imageTypeRegExp = /^image\/[(jpeg)(png)(jpg)]/;
    this.clearCanvas();
    if (imageTypeRegExp.test(files[0].type)) {
      this.publicImage(files[0]);
    } else {
      this.error.style.display = 'initial';
    }
  }

  publicImage(fileImage) {

    this.imageLoader.style.display = 'initial';
    this.state = 'load';
    const formData = new FormData();
    formData.append('title', fileImage.name)
    formData.append('image', fileImage);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://neto-api.herokuapp.com/pic');

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        const promise = this.updateImage(data.url, data)
          .then((data) => {
            this.imageLoader.style.display = 'none';
            this.id = data.id;
            //сохраняем id картинки в sessionStorage
            sessionStorage.setItem('id', this.id);
            this.comments.setId(this.id);
            this.initNetwork(this.id);
            this.setState('share', this.id);
          });
      } else {
        throw `${xhr}`;
      }
    });

    xhr.addEventListener('error', () => {
      this.onError(`${xhr.status}, ${xhr.statusText}`);
    });

    xhr.send(formData);
  }

  onError(text) {
    const networkError = this.error.cloneNode(true);
    networkError.style.display = 'initial';
    this.actionsClass('add', networkError, 'error-network');
    const errorMessage = networkError.querySelector('.error__message');
    errorMessage.textContent = `${text}`;
    this.app.appendChild(networkError);
    this.state = 'error';
  }

  setState(stateName) {
    this.state = stateName;
    if (this.comments) {
      this.comments.closeAllComments();
    }
    this.menu.selectedMenu(stateName, this.id);
  }

  getImage(id) {
    //todo: для тестирования
    this.id = id;

    const url = `
        https://neto-api.herokuapp.com/pic/${id}`;

    fetch(url, {
      method: 'GET'
    })
      .then((res) => {
        if (200 <= res.status && res.status < 300) {
          return res;
        }
        throw new Error(res.statusText);
      })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        return this.updateImage(data.url, data)
      })
      .then((data) => {
        this.id = data.id;
        if (data.comments) {
          this.comments.renderComments(data.comments);
          this.comments.closeAllComments();
        }
        if (this.state !== 'comments') {
          this.setState('share', this.id)
        }
      })
      .catch((error) => {
        this.onError(error);
      });
    ;
  }

  parseMessage(event) {
    const data = JSON.parse(event.data);
    switch (data.event) {
      case 'pic':
        this.mask.loadMask(data.pic.mask)
          .then(()=>{
            
          })
          .catch((event) => {
            console.log(event);
          });
        break;
      case 'comment':
        this.comments.renderComment(data.comment);
        break;
      case 'mask':
        this.mask.loadMask(data.url)
          .then(() => {
            if (this.arrayCanvas.length > 0) {
              const elem = this.arrayCanvas.shift();
              this.app.removeChild(elem);
            }
          })
          .catch((event) => {
            console.log(event)
          });

        break;
      case 'error':
        console.log('error', event);
        break;
    }
  }
}


const app = new App();



