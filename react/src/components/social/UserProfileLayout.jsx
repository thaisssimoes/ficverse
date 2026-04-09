import { useState } from 'react';
import ProfileHero from './ProfileHero';
import Tabs from '../ui/Tabs';
import styles from './UserProfileLayout.module.css';

export default function UserProfileLayout({
  username,
  bio,
  fanficsCount = 0,
  avatarUrl,
  bannerUrl,
  isOwn = false,
  showBlockMenu = false,
  isBlocked = false,
  onAvatarUpload,
  onBannerUpload,
  onBlock,
  onUnblock,
  onViewPublicProfile,
  onCopyProfileLink,
  worksTab,
  boardTab,
  listsTab,
}) {
  const [activeTab, setActiveTab] = useState('works');

  const tabs = [
    { key: 'works', label: 'Obras', count: fanficsCount },
    { key: 'board', label: 'Mural' },
    { key: 'lists', label: 'Listas de Leitura' },
  ];

  return (
    <div className={styles.layout}>
      <ProfileHero
        username={username}
        bio={bio}
        fanficsCount={fanficsCount}
        avatarUrl={avatarUrl}
        bannerUrl={bannerUrl}
        isOwn={isOwn}
        showBlockMenu={showBlockMenu}
        isBlocked={isBlocked}
        onAvatarUpload={onAvatarUpload}
        onBannerUpload={onBannerUpload}
        onBlock={onBlock}
        onUnblock={onUnblock}
        onViewPublicProfile={onViewPublicProfile}
        onCopyProfileLink={onCopyProfileLink}
      />

      <div className={styles.tabsSection}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'works' && <div className={styles.panel}>{worksTab}</div>}
        {activeTab === 'board' && <div className={styles.panel}>{boardTab}</div>}
        {activeTab === 'lists' && <div className={styles.panel}>{listsTab}</div>}
      </div>
    </div>
  );
}
