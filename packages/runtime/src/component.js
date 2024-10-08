import equal from "fast-deep-equal";
import { destroyDOM } from "./destroy-dom";
import { mountDOM } from "./dom";
import { DOM_TYPES, extractChildren } from "./h";
import { patchDOM } from "./patch-dom";
import { hasOwnProperty } from "./utils/objects";
import { Dispatcher } from "./dispatcher";

export function defineComponent({ render, state, ...methods }) {
  class Component {
    #isMounted = false;
    #vdom = null;
    #hostEl = null;
    #eventHandlers = null;
    #parentComponent = null;
    #dispatcher = new Dispatcher();
    #subscriptions = [];

    constructor(props = {}, eventHandlers = {}, parentComponent = null) {
      this.props = props;
      this.state = state ? state(props) : {};
      this.#eventHandlers = eventHandlers;
      this.#parentComponent = parentComponent;
    }

    get elements() {
      if (this.#vdom == null) {
        return [];
      }

      if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
        return extractChildren(this.#vdom).flatMap((child) => {
          if (child.type === DOM_TYPES.COMPONENT) {
            return child.component.elements;
          }

          return [child.el];
        });
      }

      return [this.#vdom.el];
    }

    get firstElement() {
      return this.elements[0];
    }

    get offset() {
      if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
        return Array.from(this.#hostEl.children).indexOf(this.firstElement);
      }
      return 0;
    }

    updateState(state) {
      this.state = { ...this.state, ...state };
      this.#patch();
    }

    updateProps(props) {
      const newProps = { ...this.props, ...props };
      if (equal(this.props, newProps)) return;
      this.props = newProps;
      this.#patch();
    }

    render() {
      return render.call(this);
    }

    mount(hostEl, index = null) {
      if (this.#isMounted) {
        throw new Error("Component is already mounted. Unmount it first.");
      }
      this.#vdom = this.render();
      mountDOM(this.#vdom, hostEl, index, this);
      this.#wireEventHandlers();
      this.#hostEl = hostEl;
      this.#isMounted = true;
    }

    unmount() {
      if (!this.#isMounted) {
        throw new Error("Component is not mounted. Mount it first.");
      }
      destroyDOM(this.#vdom);
      this.#subscriptions.forEach((unsubscribe) => unsubscribe());
      this.#vdom = null;
      this.#hostEl = null;
      this.#isMounted = false;
      this.#subscriptions = [];
    }

    #patch() {
      if (!this.#isMounted) {
        throw new Error("Component is not mounted. Mount it first.");
      }
      const vdom = this.render();
      this.#vdom = patchDOM(this.#vdom, vdom, this.#hostEl, this);
    }

    #wireEventHandlers() {
      this.#subscriptions = Object.entries(this.#eventHandlers).map(
        ([eventName, handler]) => this.#wireEventHandler(eventName, handler)
      );
    }

    #wireEventHandler(eventName, handler) {
      return this.#dispatcher.subscribe(eventName, (payload) => {
        if (this.#parentComponent) {
          handler.call(this.#parentComponent, payload);
        } else {
          handler(payload);
        }
      });
    }

    emit(eventName, payload) {
      this.#dispatcher.dispatch(eventName, payload);
    }
  }

  for (const methodName in methods) {
    if (hasOwnProperty(Component, methodName)) {
      throw new Error(`Component already has a method named '${methodName}'.`);
    }
    Component.prototype[methodName] = methods[methodName];
  }

  return Component;
}
