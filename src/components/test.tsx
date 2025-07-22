import React, { useEffect, useState } from "react";
type ToDo = {
  id: number;
  title: string;
  completed: boolean;
};
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};
export default function Test() {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const filteredTodos = todos.filter((todo) =>
    todo.title.includes(debouncedSearch)
  );
  const handleAddTodo = () => {
    const textTrim = text.trim();
    if (textTrim.length === 0) return;
    setTodos((pre) => [
      ...pre,
      { id: pre.length + 1, title: textTrim, completed: false },
    ]);
    setText("");
  };
  const handleDeleteTodo = (id: number) => {
    setTodos((pre) => pre.filter((todo) => todo.id !== id));
  };
  const handleToggleTodo = (id: number) => {
    setTodos((pre) =>
      pre.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  const handleEditTodo = (id: number, title: string) => {
    setTodos((pre) =>
      pre.map((todo) => (todo.id === id ? { ...todo, title } : todo))
    );
  };

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleAddTodo}>Add</button>
      <ul>
        {filteredTodos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleTodo(todo.id)}
            />
            <input
              type="text"
              value={todo.title}
              onChange={(e) => handleEditTodo(todo.id, e.target.value)}
            />
            <button onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
