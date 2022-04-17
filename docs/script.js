class AnnotationClient {
    constructor(opts) {
        this.opts = opts;
        document.onmousedown = this.mousedownHandler;
        document.onmouseup = this.mouseupHandler;
        // Add event listeners to RT elements
        for (let rt of document.getElementsByTagName("RT")) {
            rt.addEventListener('blur', this.blurHandler);
            rt.addEventListener('keydown', this.preventNewline);
            rt.addEventListener('keyup', this.enterAnnotation);
        }
    }

    saveDom = () => {
        const html = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
        const url = window.location.pathname;
        const filename = url.substring(url.lastIndexOf(this.opts.staticUrl)+this.opts.staticUrl.length);
        return fetch(this.opts.url, {
            method: "POST",
            headers: {"Content-Type": "application/json" },
            body: JSON.stringify({
                filename: filename,
                html: html
            }),
        })
    }

    selectElementContents = (el) => {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    replaceRubyElement(rt) {
        const annotationParent = rt.parentNode.parentNode;
        rt.textContent = '';
        const textNode = document.createTextNode(rt.parentNode.textContent);
        rt.parentNode.replaceWith(textNode);
        annotationParent.normalize();
    }

    deleteAnnotation(rt) {
        this.replaceRubyElement(rt);
    }

    blurHandler = (event) => {
        const rt = event.target;
        const annotation = rt.textContent.trim();
        if (annotation.length === 0) {
            this.deleteAnnotation(rt);
        } else if (annotation == '?') {
            rt.parentNode.className = "missing";
        } else {
            rt.parentNode.removeAttribute("class");
        }

        this.saveDom().then(response => {
            if (response.status !== 200) {
                throw response.statusText;
            }
        }).catch(err => {
            location.reload();
            console.log("Could not save changes!");
        });
    }

    enterAnnotation = (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            event.target.blur();
      }
    }

    preventNewline = (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    }

    createRubyElement = (selectionText) => {
        const ruby = document.createElement('ruby');
        ruby.className = "missing";
        ruby.appendChild(document.createTextNode(selectionText));
        const rt = document.createElement('rt');
        rt.textContent = '?';
        rt.setAttribute('contenteditable', 'true');
        rt.setAttribute('spellcheck', 'false');
        rt.addEventListener('blur', this.blurHandler);
        rt.addEventListener('keydown', this.preventNewline);
        rt.addEventListener('keyup', this.enterAnnotation);
        ruby.appendChild(rt);
        return [ruby, rt];
    }

    mousedownHandler = (event) => {
        if (event.buttons === 2) {
            return;
        }
        const selection = document.getSelection();
        selection.removeAllRanges();
    }

    createAnnotation = (selectionText, offset, node) => {
        const parent = node.parentNode;
        const [ruby, rt] = this.createRubyElement(selectionText);

        // Replace selected text with annotated text
        if (offset === 0) {
            node.textContent = node.textContent.substring(selectionText.length);
            parent.insertBefore(ruby, node); 
        } else if (offset + selectionText.length === node.textContent.length) {
            node.textContent = node.textContent.substring(0, offset);
            parent.appendChild(ruby);
        } else {
            const second = node.splitText(offset);
            second.textContent = second.textContent.substring(selectionText.length);
            parent.insertBefore(ruby, second);
        }

        this.saveDom().then(response => {
            if (response.status !== 200) {
                throw response.statusText;
            }
            rt.focus();
            this.selectElementContents(rt);
        }).catch(err => {
            location.reload();
            console.log("Could not save annotation!");
        });
    };

    mouseupHandler = (event) => {
        if (!event.ctrlKey) {
            return;
        }
        const selection = document.getSelection();
        if (!selection.toString() || selection.anchorNode.parentNode.nodeName === 'RUBY' || selection.anchorNode.parentNode.nodeName === 'RT') {
            return;
        }
        if (selection.anchorNode !== selection.focusNode) {
            console.log("Cannot create annotation accross nodes!");
            return;
        }
        const node = selection.anchorNode;
        if (node.nodeType !== 3) {
            console.log("Cannot create annotation for non-text node!");
            return;
        }
        const startOffset = selection.anchorOffset;
        const endOffset = selection.getRangeAt(0).endOffset;
        // Get proper selection text (selection.toString() ignores stuff that is not displayed 
        // and thus cannot be used for offset calculations)
        const selectionText = node.textContent.substring(startOffset, endOffset);
        this.createAnnotation(selectionText, startOffset, node);
    }
}

const annotationClient = new AnnotationClient({
    url: "/save",
    staticUrl: "documents/",
});