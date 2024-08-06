import React from 'react';
import PropTypes from 'prop-types';

import { Button } from './Button';
import { useEntityData } from '../src';
import './header.css';

export const Dao = ({ user, onLogin, onLogout, onCreateAccount }) => {

  const entityManager = useEntityData({
    state: {
      test: 'test',
      test2: 'test2'
    },
    query: {
      date: '2021-01-01',
      type: 2,
      id: '231qw123'
    },
    pull: async (qd) => {
      console.log('pull', qd);
      await new Promise((res) => {
        setTimeout(() => {
          res();
        }, Math.random() * 1500)
      });

      return {
        test: 'test55',
        test3: 'test2',
        test4: 'test2'
      }
    },
    put: async (state) => {
      console.log('put', state);
      await new Promise((res) => {
        setTimeout(() => {
          res();
        }, Math.random() * 1500)
      });

      return {
        test: 'hasPosted'
      }

    }
  });

  const dateChange = entityManager.createQueryChange('date');
  const typeChange = entityManager.createQueryChange('type');
  const idChange = entityManager.createQueryChange('id', {
    refresh: true
  });


  return (
    <header>
      ttttttttttt
      loading: {entityManager.loading ? 'true' : 'false'}
      putLoading: {entityManager.putLoading ? 'true' : 'false'}
      state:{JSON.stringify(entityManager.state)}
      query: {JSON.stringify(entityManager.query)}
      <input onChange={e => dateChange(e.target.value)} placeholder='date-input' />
      <input onChange={e => typeChange(e.target.value)} placeholder='type-input' />
      <input onChange={e => idChange(e.target.value)} placeholder='id-input'/>
      <input onChange={e => entityManager.setQueryData({
        id: e.target.value
      })} placeholder='custom-input'/>
      <button onClick={entityManager.refresh}>查询</button>
      <button onClick={entityManager.put}>提交</button>
      <button onClick={entityManager.reset}>重置</button>
    </header>
  )
};

Dao.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }),
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onCreateAccount: PropTypes.func.isRequired,
};

Dao.defaultProps = {
  user: null,
};
