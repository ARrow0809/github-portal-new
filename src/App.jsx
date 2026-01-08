import { useState, useEffect, useMemo, useRef } from 'react';

const GITHUB_USERNAME = 'ARrow0809';
const REFRESH_INTERVAL = 60000; // 1 minute

function App() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updated'); // updated, created_new, created_old, stars, name
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const lastSignatureRef = useRef('');

  const fetchRepos = () => {
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const signature = data
            .map(repo => `${repo.id}:${repo.updated_at}:${repo.pushed_at}`)
            .join('|');
          if (signature !== lastSignatureRef.current) {
            lastSignatureRef.current = signature;
            setRepos(data);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching repos:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRepos();
    const interval = setInterval(fetchRepos, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const languages = useMemo(() => {
    const langs = new Set(['All']);
    repos.forEach(repo => {
      if (repo.language) langs.add(repo.language);
    });
    return Array.from(langs);
  }, [repos]);

  const filteredAndSortedRepos = useMemo(() => {
    let result = repos.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLang = selectedLanguage === 'All' || repo.language === selectedLanguage;
      return matchesSearch && matchesLang;
    });

    result.sort((a, b) => {
      if (sortBy === 'updated') return new Date(b.updated_at) - new Date(a.updated_at);
      if (sortBy === 'created_new') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'created_old') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [repos, searchTerm, sortBy, selectedLanguage]);

  const groupedRepos = useMemo(() => {
    const groups = new Map();
    filteredAndSortedRepos.forEach(repo => {
      const key = repo.language || 'その他';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(repo);
    });
    return Array.from(groups.entries());
  }, [filteredAndSortedRepos]);

  const getDeployUrl = (repo) => {
    if (repo.homepage) return repo.homepage;
    if (repo.name === 'my-Portfolio') return 'https://service-886406686150.us-west1.run.app/';
    if (repo.has_pages) return `https://${GITHUB_USERNAME.toLowerCase()}.github.io/${repo.name}/`;
    return '';
  };

  return (
    <div className="container">
      <header>
        <div className="logo-section">
          <div className="github-icon"></div>
          <h1>あろうのギャラリー</h1>
        </div>
        <div className="header-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="リポジトリを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="glass-select">
              <option value="updated">最終更新順</option>
              <option value="created_new">作成日時（新しい順）</option>
              <option value="created_old">作成日時（古い順）</option>
              <option value="stars">スター順</option>
              <option value="name">名前順</option>
            </select>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="glass-select">
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'All' ? 'カテゴリ: すべて' : `カテゴリ: ${lang}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main>
        {loading && repos.length === 0 ? (
          <div className="loading">
             <div className="loader-inner"></div>
             <span>『リアリティ』を取得中…</span>
          </div>
        ) : (
          groupedRepos.map(([lang, list]) => (
            <section key={lang} className="group-section">
              <div className="group-head">
                <h2>{lang}</h2>
                <span className="group-count">{list.length}件</span>
              </div>
              <div className="repo-grid">
                {list.map(repo => (
                  <div key={repo.id} className="repo-card">
                    <div className="card-glass"></div>
                    <div className="card-content">
                      <div className="repo-icon">
                        <span className="icon-main">{repo.language ? repo.language[0] : 'JS'}</span>
                      </div>
                      <h3>{repo.name}</h3>
                      <p>{repo.description || '真実はコードの中にある。'}</p>
                      
                      <div className="repo-meta">
                        <span className="language-badge">{repo.language || 'その他'}</span>
                        <span className="star-badge">★ {repo.stargazers_count}</span>
                      </div>
                      <div className="repo-updated">
                        更新: {new Date(repo.updated_at).toLocaleDateString('ja-JP')}
                      </div>

                      <div className="card-actions">
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="btn-action primary">GitHubへ</a>
                        {getDeployUrl(repo) && (
                          <a 
                            href={getDeployUrl(repo)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn-action secondary"
                          >
                            公開サイト
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <footer>
        <p>© 2026 あろうのギャラリー | 60秒ごとに自動更新</p>
      </footer>
    </div>
  );
}

export default App;
