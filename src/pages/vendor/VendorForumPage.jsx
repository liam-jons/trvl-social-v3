import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ForumLayout from '../../components/vendor/forum/ForumLayout';
import ThreadList from '../../components/vendor/forum/ThreadList';
import ThreadView from '../../components/vendor/forum/ThreadView';
import CreateThread from '../../components/vendor/forum/CreateThread';
import ModerationTools from '../../components/vendor/forum/ModerationTools';
import ReputationSystem from '../../components/vendor/forum/ReputationSystem';

const VendorForumPage = () => {
  return (
    <Routes>
      <Route path="/" element={<ForumLayout />}>
        <Route index element={<ThreadList />} />
        <Route path="thread/:threadId" element={<ThreadView />} />
        <Route path="new" element={<CreateThread />} />
        <Route path="moderation" element={<ModerationTools />} />
        <Route path="reputation" element={<ReputationSystem />} />
      </Route>
    </Routes>
  );
};

export default VendorForumPage;