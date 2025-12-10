import { useState } from 'react';
import { Layout, Model } from 'flexlayout-react';
import 'flexlayout-react/style/dark.css'; // Important for default layout styles
import ArticleTable from './components/ArticleTable';
import ArticleViewer from './components/ArticleViewer';

// Default Layout Configuration
const json = {
  global: { tabEnableClose: false },
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 62,
        id: "list_zone",
        children: [
          { type: "tab", name: "Articles", component: "ArticleTable" }
        ]
      },
      {
        type: "tabset",
        id: "viewer_zone", // Target ID for new tabs
        weight: 38,
        children: [
          // Start empty or with a placeholder? Let's keep one generic tab
          { type: "tab", name: "Welcome", component: "ArticleViewer", enableClose: true }
        ]
      }
    ]
  }
};

const model = Model.fromJson(json);

function App() {

  const factory = (node) => {
    const component = node.getComponent();
    if (component === "ArticleTable") {
      return <ArticleTable model={model} />;
    }
    if (component === "ArticleViewer") {
      // Read article data from the node's config
      const articleData = node.getConfig();
      return <ArticleViewer article={articleData} />;
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw' }}>
      <Layout model={model} factory={factory} />
    </div>
  );
}

export default App;