import store from "../store"

// Ends with brackets e.g. [data-ref="foo[]"]
const ARRAY_REF_PATTERN = /([a-zA-Z\d]*)(\[?\]?)/

export default class BaseComponent {
  static template = null;
  static stylesheet = null;

  element = null;
  refs = {};
  serializer = document.createElement("div");
  store = store;

  constructor(spec = {}) {
    const {stylesheet} = this.constructor

    const {document: iframeDocument} = store.iframe

    Object.assign(this, spec)

    if (stylesheet && !this.constructor.style) {
      const style = this.constructor.style = iframeDocument.createElement("style")

      style.innerHTML = stylesheet
      iframeDocument.head.appendChild(style)
    }
  }

  autofocus() {
    const focusElement = this.element.querySelector("[autofocus]")

    if (focusElement) focusElement.focus()
  }

  // NOTE: Calling `updateRefs` multiple times from different tree depths may
  // allow parents to inherit a grandchild.
  updateRefs() {
    const {refs} = this

    Array
      .from(this.element.querySelectorAll("[data-ref]"))
      .forEach(element => {
        const attribute = element.getAttribute("data-ref")
        const [, key, arrayKey] = attribute.match(ARRAY_REF_PATTERN)

        if (arrayKey) {
          // Multiple elements
          if (!Array.isArray(refs[key])) refs[key] = []

          refs[key].push(element)
        }
        else {
          // Single element
          refs[key] = element
        }

        element.removeAttribute("data-ref")
      })
  }

  compileTemplate(options = {}) {
    const {template} = this.constructor

    if (typeof template === "function") {
      this.serializer.innerHTML = template({store, ...options})
    }
    else {
      this.serializer.innerHTML = template
    }

    this.element = this.serializer.firstChild
    this.updateRefs()

    return this.element
  }

  insertBefore(sibling, element) {
    element.parentNode.insertBefore(sibling, element)
  }

  render() {
    return this.compileTemplate()
  }

  // TODO: Check if this used after the app is fleshed out.
  replaceElement(current, next) {
    current.parentNode.insertBefore(next, current)
    current.parentNode.removeChild(current)

    this.updateRefs()
  }
}
