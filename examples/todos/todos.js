import {
  createApp,
  h,
  hFragment,
} from "https://unpkg.com/@harishkrishnan24/dupe-js@2.0.1";

const state = {
  currentTodo: "",
  edit: {
    idx: null,
    original: null,
    edited: null,
  },
  todos: ["Go to Gym", "Buy Groceries"],
};

const reducers = {
  "update-currrent-todo": (state, currentTodo) => ({ ...state, currentTodo }),
  "add-todo": (state) => ({
    ...state,
    currentTodo: "",
    todos: [...state.todos, state.currentTodo],
  }),
  "start-editing-todo": (state, idx) => ({
    ...state,
    edit: { idx, original: state.todos[idx], edited: state.todos[idx] },
  }),
  "edit-todo": (state, edited) => ({
    ...state,
    edit: { ...state.edit, edited },
  }),
  "save-edited-todo": (state) => {
    const todos = [...state.todos];
    todos[state.edit.idx] = state.edit.edited;

    return {
      ...state,
      todos,
      edit: { idx: null, original: null, edited: null },
    };
  },
  "cancel-editing-todo": (state) => ({
    ...state,
    edit: { idx: null, original: null, edited: null },
  }),
  "remove-todo": (state, idx) => ({
    ...state,
    todos: state.todos.filter((_, i) => i !== idx),
  }),
};

function App(state, emit) {
  return hFragment([
    h("h1", {}, ["My Todo's"]),
    CreateTodo(state, emit),
    TodoList(state, emit),
  ]);
}

function CreateTodo({ currentTodo }, emit) {
  return h("div", {}, [
    h("label", { for: "todo-input" }, ["New Todo"]),
    h("input", {
      type: "text",
      id: "todo-input",
      value: currentTodo,
      on: {
        input: ({ target }) => emit("update-currrent-todo", target.value),
        keydown: ({ key }) => {
          if (key === "Enter" && currentTodo.length >= 3) {
            emit("add-todo");
          }
        },
      },
    }),
    h(
      "button",
      {
        disabled: currentTodo.length < 3,
        on: { click: () => emit("add-todo") },
      },
      ["Add"]
    ),
  ]);
}

function TodoList({ todos, edit }, emit) {
  return h(
    "ul",
    {},
    todos.map((todo, idx) => TodoItem({ todo, idx, edit }, emit))
  );
}

function TodoItem({ todo, idx, edit }, emit) {
  const isEditing = edit.idx === idx;

  return isEditing
    ? h("li", {}, [
        h("input", {
          value: edit.edited,
          on: { input: ({ target }) => emit("edit-todo", target.value) },
        }),
        h("button", { on: { click: () => emit("save-edited-todo") } }, [
          "Save",
        ]),
        h("button", { on: { click: () => emit("cancel-editing-todo") } }, [
          "Cancel",
        ]),
      ])
    : h("li", {}, [
        h("span", { on: { dblclick: () => emit("start-editing-todo", idx) } }, [
          todo,
        ]),
        h("button", { on: { click: () => emit("remove-todo", idx) } }, [
          "Done",
        ]),
      ]);
}

createApp({ state, reducers, view: App }).mount(document.body);
