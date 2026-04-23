const STORAGE_KEY = 'notably.todos.v1';

const state = {
    todos: loadTodos(),
    filter: 'all',
};

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const count = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();

    if (!text) {
        return;
    }

    state.todos.unshift({
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
    });

    input.value = '';
    saveTodos();
    render();
});

list.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
        return;
    }

    const item = target.closest('.item');
    if (!item) {
        return;
    }

    const todo = state.todos.find((entry) => entry.id === item.dataset.id);
    if (!todo) {
        return;
    }

    todo.completed = target.checked;
    saveTodos();
    render();
});

list.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('delete')) {
        return;
    }

    const item = target.closest('.item');
    if (!item) {
        return;
    }

    state.todos = state.todos.filter((todo) => todo.id !== item.dataset.id);
    saveTodos();
    render();
});

clearCompletedBtn.addEventListener('click', () => {
    state.todos = state.todos.filter((todo) => !todo.completed);
    saveTodos();
    render();
});

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        state.filter = button.dataset.filter || 'all';
        render();
    });
});

function filteredTodos() {
    if (state.filter === 'active') {
        return state.todos.filter((todo) => !todo.completed);
    }

    if (state.filter === 'completed') {
        return state.todos.filter((todo) => todo.completed);
    }

    return state.todos;
}

function render() {
    const visibleTodos = filteredTodos();
    const activeCount = state.todos.filter((todo) => !todo.completed).length;
    const hasCompleted = state.todos.some((todo) => todo.completed);

    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === state.filter;
        button.classList.toggle('active', isActive);
    });

    clearCompletedBtn.disabled = !hasCompleted;
    clearCompletedBtn.style.opacity = hasCompleted ? '1' : '0.5';
    clearCompletedBtn.style.cursor = hasCompleted ? 'pointer' : 'not-allowed';

    count.textContent = `${activeCount} left`;

    if (visibleTodos.length === 0) {
        list.innerHTML = '<li class="empty">No tasks in this view. Add one above.</li>';
        return;
    }

    list.innerHTML = visibleTodos
        .map((todo) => {
            const checked = todo.completed ? 'checked' : '';
            const doneClass = todo.completed ? ' done' : '';
            return `
				<li class="item${doneClass}" data-id="${todo.id}">
					<input class="check" type="checkbox" aria-label="Toggle task" ${checked}>
					<p class="item-text">${escapeHtml(todo.text)}</p>
					<button class="delete" type="button" aria-label="Delete task">×</button>
				</li>
			`;
        })
        .join('');
}

function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function loadTodos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .filter((item) => item && typeof item.id === 'string' && typeof item.text === 'string')
            .map((item) => ({
                id: item.id,
                text: item.text,
                completed: Boolean(item.completed),
                createdAt: Number(item.createdAt) || Date.now(),
            }));
    } catch {
        return [];
    }
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

render();
function getTimestamp() { return new Date().toISOString(); }
