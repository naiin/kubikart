(function () {
  'use strict';

  var list = document.getElementById('kubikart-kit-items');
  var addButton = document.getElementById('kubikart-kit-add');
  var template = document.getElementById('kubikart-kit-row-template');
  var live = document.getElementById('kubikart-kit-live');

  if (!list || !addButton || !template) {
    return;
  }

  var maxItems = parseInt(list.getAttribute('data-max-items'), 10) || 30;
  var mediaFrame = null;

  function rows() {
    return Array.prototype.slice.call(list.querySelectorAll('[data-kit-row]'));
  }

  function announce(message) {
    if (live) {
      live.textContent = message;
    }
  }

  function refresh() {
    var all = rows();
    all.forEach(function (row, index) {
      var number = row.querySelector('[data-kit-row-number]');
      if (number) {
        number.textContent = 'Eintrag ' + (index + 1);
      }
      var up = row.querySelector('[data-kit-move="up"]');
      var down = row.querySelector('[data-kit-move="down"]');
      if (up) {
        up.disabled = index === 0;
      }
      if (down) {
        down.disabled = index === all.length - 1;
      }
    });
    addButton.disabled = all.length >= maxItems;
  }

  function toggleImage(row) {
    var select = row.querySelector('[data-kit-product]');
    var image = row.querySelector('[data-kit-image]');
    if (!select || !image) {
      return;
    }
    image.hidden = !!select.value;
  }

  function setImage(row, id, url) {
    var input = row.querySelector('[data-kit-image-id]');
    var preview = row.querySelector('[data-kit-image-preview]');
    var clear = row.querySelector('[data-kit-image-clear]');
    input.value = id || '';
    if (url) {
      preview.src = url;
      preview.hidden = false;
    } else {
      preview.removeAttribute('src');
      preview.hidden = true;
    }
    clear.hidden = !id;
  }

  function addRow() {
    if (rows().length >= maxItems) {
      return;
    }
    var index = parseInt(list.getAttribute('data-next-index'), 10) || rows().length;
    list.setAttribute('data-next-index', String(index + 1));

    var holder = document.createElement('div');
    holder.innerHTML = template.innerHTML.replace(/__INDEX__/g, String(index));
    var row = holder.firstElementChild;
    while (holder.firstChild) {
      list.appendChild(holder.firstChild);
    }

    if (window.jQuery) {
      window.jQuery(document.body).trigger('wc-enhanced-select-init');
    }
    refresh();
    var focusTarget = row && row.querySelector('select, input[type="text"]');
    if (focusTarget) {
      focusTarget.focus();
    }
  }

  function moveRow(row, direction) {
    var sibling = direction === 'up' ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) {
      return;
    }
    if (direction === 'up') {
      list.insertBefore(row, sibling);
    } else {
      list.insertBefore(sibling, row);
    }
    refresh();
    var position = rows().indexOf(row) + 1;
    announce('Eintrag verschoben auf Position ' + position + ' von ' + rows().length + '.');
    var button = row.querySelector('[data-kit-move="' + direction + '"]');
    if (button && !button.disabled) {
      button.focus();
    }
  }

  function openMedia(row) {
    if (!window.wp || !window.wp.media) {
      return;
    }
    mediaFrame = window.wp.media({
      title: 'Bild für den Paketeintrag',
      button: { text: 'Bild verwenden' },
      library: { type: 'image' },
      multiple: false
    });
    mediaFrame.on('select', function () {
      var attachment = mediaFrame.state().get('selection').first().toJSON();
      var sizes = attachment.sizes || {};
      var url = (sizes.thumbnail && sizes.thumbnail.url) || attachment.url;
      setImage(row, attachment.id, url);
    });
    mediaFrame.open();
  }

  list.addEventListener('click', function (event) {
    var target = event.target.closest('button');
    if (!target) {
      return;
    }
    var row = target.closest('[data-kit-row]');
    if (!row) {
      return;
    }

    if (target.hasAttribute('data-kit-move')) {
      moveRow(row, target.getAttribute('data-kit-move'));
    } else if (target.hasAttribute('data-kit-remove')) {
      var next = row.nextElementSibling || row.previousElementSibling;
      row.parentNode.removeChild(row);
      refresh();
      announce('Eintrag entfernt.');
      (next ? next.querySelector('[data-kit-remove]') : addButton).focus();
    } else if (target.hasAttribute('data-kit-image-select')) {
      openMedia(row);
    } else if (target.hasAttribute('data-kit-image-clear')) {
      setImage(row, '', '');
    }
  });

  list.addEventListener('change', function (event) {
    var row = event.target.closest && event.target.closest('[data-kit-row]');
    if (row && event.target.hasAttribute('data-kit-product')) {
      toggleImage(row);
    }
  });

  // select2 fires jQuery events, not native change events.
  if (window.jQuery) {
    window.jQuery(list).on('change', '[data-kit-product]', function () {
      toggleImage(this.closest('[data-kit-row]'));
    });
  }

  addButton.addEventListener('click', addRow);
  refresh();
})();
