class AbstractSet {
  constructor (data) {
    this.beeps = {};
    this.length = 0;

    for (let k in data) {
      if (this.beeps[k] === null || this.beeps[k] === undefined) {
        ++this.length;
      }

      this.beeps[k] = new Beep(data[k], k);
    }
  }

  destroy() {
    for (let i in this.data) {
      this.beeps[i].destroy();
      this.beeps[i] = null;
    }

    this.beeps = null;
  }
}
class Beep {
  constructor (sound, id) {
    this.audio = new Audio(sound);
    this.id = id || Date.now();
  }

  play() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.play();
  }

  destroy() {
    this.audio = null;
    this.id = null;
  }
}
class Drums extends AbstractSet {
  constructor() {
    const data = {
      Snare: 'sounds/drums/snare.wav',
      Crash: 'sounds/drums/crash.wav',
      HihatClosed: 'sounds/drums/hihat_closed.wav',
      Kick: 'sounds/drums/kick.wav'
    };

    super(data);
  }
}
class MessageBus {

  constructor() {
    this.subscribers = {};
  }

  send (type, data) {
    if (this.subscribers[type] !== null && this.subscribers[type] !== undefined) {
      for (var i = 0; i < this.subscribers[type].length; ++i) {
        this.subscribers[type][i]['object'][this.subscribers[type][i]['func']](data);
      }
    }
  }

  subscribe (type, object, func) {
    if (this.subscribers[type] === null || this.subscribers[type] === undefined) {
      this.subscribers[type] = [];
    }

    this.subscribers[type].push({
      object: object,
      func: func
    });
  }

  unsubscribe (type, object, func) {
    for (var i = 0; i < this.subscribers[type].length; ++i) {
      if (this.subscribers[type][i].object === object && this.subscribers[type][i].func === func) {
        this.subscribers[type].slice(i, 1);
        break;
      }
    }
  }

  unsubsribeType (type) {
    delete this.subscribers[type];
  }

  destroy() {
    for (type in this.subscribers) {
      this.unsubsribeType(type);
    }

    this.subscribers = null;
  }
}
class AbstractSetController {
  constructor (model) {
    this.model = new model();
    this.addEventListeners();
  }

  addEventListeners() {
    this.manageEventListeners(true);
  }

  removeEventListeners() {
    this.manageEventListeners(false);
  }

  manageEventListeners (addFlag) {
    asafonov.messageBus[addFlag ? 'subscribe' : 'unsubscribe'](asafonov.events.BEEP, this, 'onBeep');
  }

  onBeep (data) {
    if (this.model.beeps[data.name] !== null && this.model.beeps[data.name] !== undefined) {
      this.model.beeps[data.name].play();
    }
  }

  destroy() {
    this.removeEventListeners();
  }
}
class DrumsController extends AbstractSetController {
  constructor() {
    super(Drums);
  }
}
class DrumsView {
  constructor (model) {
    this.model = model;
    this.element = document.querySelector('.scene');
    this.onDrumClickedProxy = this.onDrumClicked.bind(this);
    this.init();
  }

  init() {
    const cnt = this.model.length;
    const hcnt = cnt % 2 == 0 ? cnt / 2 : (cnt + 1) / 2;
    const itemWidth = (this.element.offsetWidth - asafonov.settings.drumMargin * (hcnt + 1)) / hcnt;
    const itemHeight = (this.element.offsetHeight - asafonov.settings.drumMargin * 3) / 2;

    for (let k in this.model.beeps) {
      const item = document.createElement('div');
      item.className = 'drum';
      item.setAttribute('data-name', k);
      item.style.marginLeft = asafonov.settings.drumMargin + 'px';
      item.style.marginTop = asafonov.settings.drumMargin + 'px';
      item.style.width = itemWidth + 'px';
      item.style.height = itemHeight + 'px';
      item.innerHTML = k;
      this.element.appendChild(item);
      item.addEventListener('click', this.onDrumClickedProxy);
      item.addEventListener('touchend', this.onDrumClickedProxy);
    }
  }

  onDrumClicked (e) {
    const name = e.target.getAttribute('data-name');
    asafonov.messageBus.send(asafonov.events.BEEP, {name: name});
  }

  destroy() {
    this.model = null;
    const items = this.element.querySelectorAll('.drum');

    for (let i = 0; i < items.length; ++i) {
      items[i].removeEventListener('click', this.onDrumClickedProxy);
      items[i].removeEventListener('touchend', this.onDrumClickedProxy);
    }

    this.element.innerHTML = '';
    this.element = null;
  }
}
window.asafonov = {};
window.asafonov.messageBus = new MessageBus();
window.asafonov.events = {
  BEEP: 'beep'
};
window.asafonov.settings = {
  drumMargin: 10
};
document.addEventListener("DOMContentLoaded", function(event) {
  const drumsController = new DrumsController();
  const drumsView = new DrumsView(drumsController.model);
});
