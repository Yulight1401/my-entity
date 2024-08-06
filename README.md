

# My-entity

## 介绍

`my-entity` 是一个基于多年实践总结出的简单前端设计模式，主要适用于列表查询、表单提交等与后端交互的场景。该模式围绕后端的一个实体进行封装，提供了查询和修改两种主要操作，并且具备良好的可扩展性。

## 设计理念

1. **简单**：围绕后端的一个实体，前端只需要处理查询和修改两种模式。
2. **可扩展**：基于该模式，可以扩展出各种场景，如表单提交、列表查询、列表编辑、列表删除等。
3. **渐进式**：可以根据需要进行组合拆分，既可以根据后端实体进行同构，也可以根据前端实体进行同构。

## 特性

- **数据获取**：通过 `pull` 方法从远端拉取数据，并自动处理状态更新。
- **数据更新**：通过 `put` 方法更新数据，并同步更新本地状态。
- **状态管理**：提供 `useState` 和 `useEffect` 钩子函数管理组件状态。
- **错误处理**：支持自定义错误处理函数。
- **自动刷新**：支持依赖项变化自动刷新数据。

## 安装

```bash
npm install my-entity
```

## 使用方法

### 基本使用

```typescript
import { useEntityData } from 'my-entity';

const MyComponent = () => {
  const { state, query, loading, setQueryData, refresh, put } = useEntityData({
    state: { /* 初始状态 */ },
    query: { /* 初始查询参数 */ },
    pull: async (query) => {
      // 拉取数据的逻辑
      return await fetchDataFromAPI(query);
    },
    put: async (data) => {
      // 更新数据的逻辑
      return await updateDataToAPI(data);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
    refreshDeps: [/* 依赖项 */],
  });

  // 组件逻辑
};
```

### API

#### `useEntityData(config: EntityConfig<S, Q>)`

- `config`：配置对象，包含以下属性：
  - `state`：视图层初始数据。
  - `query`（可选）：查询初始数据。
  - `pull`：从远端拉取接口数据的函数。
  - `put`（可选）：更新接口体，同时更新本地数据的函数。
  - `onError`（可选）：错误处理函数。
  - `refreshDeps`（可选）：订阅数据进行刷新，默认为空。

#### 返回值

- `state`：当前状态。
- `query`：当前查询参数。
- `loading`：数据拉取的加载状态。
- `putLoading`：数据更新的加载状态。
- `setQueryData`：设置查询参数的函数。
- `setState`：设置状态的函数。
- `createQueryChange`：创建查询参数变化的函数。
- `createStateChange`：创建状态变化的函数。
- `put`：更新数据的函数。
- `reset`：重置视图层数据的函数。
- `refresh`：刷新数据的函数。

### 示例

#### 列表查询

```typescript
import { useEntityData } from 'my-entity';

const ListComponent = () => {
  const { state, query, loading, setQueryData, refresh } = useEntityData({
    state: { items: [] },
    query: { page: 1, pageSize: 10 },
    pull: async (query) => {
      const response = await fetch(`/api/items?page=${query.page}&pageSize=${query.pageSize}`);
      return await response.json();
    },
  });

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {state.items.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

#### 表单提交

```typescript
import { useEntityData } from 'my-entity';

const FormComponent = () => {
  const { state, setState, put, putLoading } = useEntityData({
    state: { name: '', age: 0 },
    put: async (data) => {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await put();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={state.name}
            onChange={(e) => setState({ ...state, name: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Age:
          <input
            type="number"
            value={state.age}
            onChange={(e) => setState({ ...state, age: parseInt(e.target.value) })}
          />
        </label>
      </div>
      <button type="submit" disabled={putLoading}>
        {putLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### 高级用法

#### 使用 `createQueryChange` 和 `createStateChange`

```typescript
import { useEntityData } from 'my-entity';

const AdvancedComponent = () => {
  const { state, query, createQueryChange, createStateChange, refresh } = useEntityData({
    state: { name: '', age: 0 },
    query: { search: '' },
    pull: async (query) => {
      const response = await fetch(`/api/search?query=${query.search}`);
      return await response.json();
    },
  });

  return (
    <div>
      <div>
        <label>
          Search:
          <input
            type="text"
            value={query.search}
            onChange={createQueryChange('search', { refresh: true })}
          />
        </label>
      </div>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={state.name}
            onChange={createStateChange('name')}
          />
        </label>
      </div>
      <div>
        <label>
          Age:
          <input
            type="number"
            value={state.age}
            onChange={createStateChange('age')}
          />
        </label>
      </div>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

### API 详细说明

#### `EntityConfig<S, Q>`

- `state` (必填): 视图层初始数据。
- `query` (可选): 查询初始数据。
- `pull` (必填): 从远端拉取接口数据的函数，接受一个查询参数 `q` 并返回一个 Promise。
- `put` (可选): 更新接口体，同时更新本地数据的函数，接受一个数据参数 `data` 并返回一个 Promise。
- `onError` (可选): 错误处理函数，接受一个错误参数 `error`。
- `refreshDeps` (可选): 订阅数据进行刷新的依赖项数组。

#### 返回的钩子函数

- `state`: 当前状态。
- `query`: 当前查询参数。
- `loading`: 数据拉取的加载状态。
- `putLoading`: 数据更新的加载状态。
- `setQueryData`: 设置查询参数的函数，接受一个新的查询对象和可选的配置。
- `setState`: 设置状态的函数，接受一个新的状态对象。
- `createQueryChange`: 创建查询参数变化的函数，接受一个字段名和可选的配置，返回一个事件处理函数。
- `createStateChange`: 创建状态变化的函数，接受一个字段名和可选的配置，返回一个事件处理函数。
- `put`: 更新数据的函数，接受一个可选的配置对象。
- `reset`: 重置视图层数据的函数。
- `refresh`: 刷新数据的函数，接受一个可选的新的查询对象。

## 贡献

欢迎对 `my-entity` 进行贡献。你可以通过提交 issue 或 pull request 来帮助我们改进这个项目。

## 许可证

`my-entity` 使用 MIT 许可证。详情请参阅 LICENSE 文件。

## 更新日志

| 版本  | 描述       |
| ----- | ---------- |
| 0.0.1 | 初始版本   |
| 0.0.2 | 完善ReadMe |

## 版本规划
0.0.3 增加Provider Factory支持

# English Version

## My-entity

## Introduction

`my-entity` is a simple frontend design pattern derived from years of practical experience, primarily suitable for scenarios involving list queries, form submissions, and other interactions with backend services. This pattern encapsulates around a backend entity, providing two main operations: query and update, with excellent extensibility.

## Design Philosophy

1. **Simplicity**: Focuses on a single backend entity, with the frontend handling only query and update modes.
2. **Extensibility**: Can be extended to various scenarios, such as form submissions, list queries, list editing, list deletion, etc.
3. **Progressiveness**: Allows for compositional splitting based on needs, supporting both backend and frontend entity isomorphism.

## Features

- **Data Fetching**: Uses the `pull` method to fetch data from remote sources and automatically handles state updates.
- **Data Updating**: Uses the `put` method to update data and synchronize local state.
- **State Management**: Utilizes `useState` and `useEffect` hooks for component state management.
- **Error Handling**: Supports custom error handling functions.
- **Auto Refresh**: Supports automatic data refresh upon dependency changes.

## Installation

```bash
npm install my-entity
```

## Usage

### Basic Usage

```typescript
import { useEntityData } from 'my-entity';

const MyComponent = () => {
  const { state, query, loading, setQueryData, refresh, put } = useEntityData({
    state: { /* Initial state */ },
    query: { /* Initial query parameters */ },
    pull: async (query) => {
      // Logic to fetch data
      return await fetchDataFromAPI(query);
    },
    put: async (data) => {
      // Logic to update data
      return await updateDataToAPI(data);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
    refreshDeps: [/* Dependencies */],
  });

  // Component logic
};
```

### API

#### `useEntityData(config: EntityConfig<S, Q>)`

- `config`: Configuration object containing the following properties:
  - `state`: Initial state for the view layer.
  - `query` (optional): Initial query parameters.
  - `pull`: Function to fetch data from remote sources.
  - `put` (optional): Function to update data and synchronize local state.
  - `onError` (optional): Error handling function.
  - `refreshDeps` (optional): Dependencies for automatic data refresh.

#### Return Values

- `state`: Current state.
- `query`: Current query parameters.
- `loading`: Loading state for data fetching.
- `putLoading`: Loading state for data updating.
- `setQueryData`: Function to set query parameters.
- `setState`: Function to set state.
- `createQueryChange`: Function to create a query change handler.
- `createStateChange`: Function to create a state change handler.
- `put`: Function to update data.
- `reset`: Function to reset view layer data.
- `refresh`: Function to refresh data.

### Examples

#### List Query

```typescript
import { useEntityData } from 'my-entity';

const ListComponent = () => {
  const { state, query, loading, setQueryData, refresh } = useEntityData({
    state: { items: [] },
    query: { page: 1, pageSize: 10 },
    pull: async (query) => {
      const response = await fetch(`/api/items?page=${query.page}&pageSize=${query.pageSize}`);
      return await response.json();
    },
  });

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {state.items.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

#### Form Submission

```typescript
import { useEntityData } from 'my-entity';

const FormComponent = () => {
  const { state, setState, put, putLoading } = useEntityData({
    state: { name: '', age: 0 },
    put: async (data) => {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await put();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={state.name}
            onChange={e => setState({ ...state, name: e.target.value })}
          />
        </label>
      </div>
      <div>
        <label>
          Age:
          <input
            type="number"
            value={state.age}
            onChange={e => setState({ ...state, age: parseInt(e.target.value) })}
          />
        </label>
      </div>
      <button type="submit" disabled={putLoading}>
        {putLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Advanced Usage

#### Using `createQueryChange` and `createStateChange`

```typescript
import { useEntityData } from 'my-entity';

const AdvancedComponent = () => {
  const { state, query, createQueryChange, createStateChange, refresh } = useEntityData({
    state: { name: '', age: 0 },
    query: { search: '' },
    pull: async (query) => {
      const response = await fetch(`/api/search?query=${query.search}`);
      return await response.json();
    },
  });

  return (
    <div>
      <div>
        <label>
          Search:
          <input
            type="text"
            value={query.search}
            onChange={createQueryChange('search', { refresh: true })}
          />
        </label>
      </div>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={state.name}
            onChange={createStateChange('name')}
          />
        </label>
      </div>
      <div>
        <label>
          Age:
          <input
            type="number"
            value={state.age}
            onChange={createStateChange('age')}
          />
        </label>
      </div>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

### Detailed API Description

#### `EntityConfig<S, Q>`

- `state` (required): Initial state for the view layer.
- `query` (optional): Initial query parameters.
- `pull` (required): Function to fetch data from remote sources, accepts a query parameter `q` and returns a Promise.
- `put` (optional): Function to update data and synchronize local state, accepts a data parameter `data` and returns a Promise.
- `onError` (optional): Error handling function, accepts an error parameter `error`.
- `refreshDeps` (optional): Array of dependencies for automatic data refresh.

#### Hook Return Values

- `state`: Current state.
- `query`: Current query parameters.
- `loading`: Loading state for data fetching.
- `putLoading`: Loading state for data updating.
- `setQueryData`: Function to set query parameters, accepts a new query object and an optional configuration.
- `setState`: Function to set state, accepts a new state object.
- `createQueryChange`: Function to create a query change handler, accepts a field name and an optional configuration, returns an event handler function.
- `createStateChange`: Function to create a state change handler, accepts a field name and an optional configuration, returns an event handler function.
- `put`: Function to update data, accepts an optional configuration object.
- `reset`: Function to reset view layer data.
- `refresh`: Function to refresh data, accepts an optional new query object.

## Contribution

We welcome contributions to `my-entity`. You can help us improve this project by submitting issues or pull requests.

## License

`my-entity` is licensed under the MIT License. See the LICENSE file for more details.

---

This simplified English README should help users understand how to use `my-entity` and its core concepts. Feel free to adjust any part of this document to better suit your needs!