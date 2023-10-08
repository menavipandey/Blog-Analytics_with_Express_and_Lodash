// app.mjs
import express from 'express';
import axios from 'axios';
import lodash from 'lodash';

const app = express();
const port = 3000;

import cors from 'cors';
app.use(cors());

// Function to fetch blog data from the third-party API
async function fetchBlogData() {
  try {
    const apiUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
    const adminSecret = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';

    const response = await axios.get(apiUrl, {
      headers: {
        'x-hasura-admin-secret': adminSecret,
      },
    });

    return response.data.blogs;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch blog data');
  }
}

// Cache the fetchBlogData function for 10 minutes 
// **Bonus Challenge**:
const memoizedFetchBlogData = lodash.memoize(fetchBlogData, () => 'fetchBlogData', 600000);

app.get('/api/blog-stats', async (req, res) => {
  try {
    const blogData = await memoizedFetchBlogData();
    if (blogData.length === 0) {
      throw new Error('No blog data available');
    }

    // Data Analysis
    const totalBlogs = blogData.length;

    let longestBlog = '';
    for (const b of blogData) {
      if (b.title.length > longestBlog.length) {
        longestBlog = b.title;
      }
    }

    const blogsWithPrivacy = blogData.filter((b) => b.title && b.title.toLowerCase().includes('privacy')).length;

    const uniqueBlogTitles = [...new Set(blogData.map((b) => b.title.toLowerCase()))];


    const totalUniqueItemNames = uniqueBlogTitles.length;

    const statistics = {
      totalBlogs: totalBlogs,
      LongestBlog: longestBlog,
      BlogsContainingPrivacy: blogsWithPrivacy,
      uniqueBlogTitles,
      UniqueBlogTitles: totalUniqueItemNames,
    };

    res.json(statistics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
  // **Error Handling**:
});

// Cache the search results for 5 minutes (adjust the time as needed)
const memoizedSearch = lodash.memoize(
  (blogData, query) => {
    const results = blogData.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()));
    return results;
  },
  (blogData, query) => query,
  300000
);


// **Blog Search Endpoint**:
app.get('/api/blog-search', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  // **Error Handling**:
  try {
    const blogData = await memoizedFetchBlogData();
    const results = memoizedSearch(blogData, query);
    res.json({ query, results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
