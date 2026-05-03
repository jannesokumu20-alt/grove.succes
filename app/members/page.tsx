'use client';

export default function MembersPage() {
  return (
    <div className="members-page">

      {/* HEADER */}
      <div className="members-header">
        <div className="header-left">
          <div className="back-btn" />
          <div>
            <h1>Members</h1>
            <p>Manage your chama members</p>
          </div>
        </div>

        <div className="add-btn" />
      </div>


      {/* STATS CARDS */}
      <div className="members-stats">
        <div className="stat-card">
          <div className="stat-icon green" />
          <div className="stat-lines">
            <div className="line big" />
            <div className="line small" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue" />
          <div className="stat-lines">
            <div className="line big" />
            <div className="line small" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple" />
          <div className="stat-lines">
            <div className="line big" />
            <div className="line small" />
          </div>
        </div>
      </div>


      {/* SEARCH */}
      <div className="members-search">
        <div className="search-left">
          <div className="search-icon" />
          <div className="search-line" />
        </div>
        <div className="filter-btn" />
      </div>


      {/* MEMBER LIST */}
      <div className="members-list">

        {/* MEMBER ITEM */}
        <div className="member-item">
          <div className="member-left">
            <div className="avatar green" />
            <div>
              <div className="name-line" />
              <div className="role-line" />
            </div>
          </div>

          <div className="member-right">
            <div className="status active" />
            <div className="arrow" />
          </div>
        </div>

        {/* DUPLICATES FOR LAYOUT */}
        <div className="member-item" />
        <div className="member-item" />
        <div className="member-item" />
        <div className="member-item" />
        <div className="member-item" />

      </div>


      {/* BOTTOM NAV SPACING */}
      <div className="bottom-space" />

    </div>
  );
}
