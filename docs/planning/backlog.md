Import/Export OPML with advanced features, selecting categories or feeds.

---

- Cluster information.
- Create a digest based on news cluster.
A news cluster could be a big event happening, and I want you to use LLM, to generate a summary of the cluster.
(add the links of the articles that are part of the cluster)


Improve reading format, the user have ADHD, and therefore big blocks of text are difficult to read.
(remember to make it configurable)


---

The sidebar menu, need to be shrinkable, showing only the feed icons.
Also implement better feed categories. (and feed configurations should be possible to set per category)
The each category should be expandable/shrinkable, and it should be persistent
the user should be able to add new categories and rename them.


---

We need to be able to remove articles after a certain time, unless they are favorited.
Or after a number of articles in the feed.
That should be configurable by user, category of feed.

---

We need to implement keyboard shortcuts (configurable by the user, with validation if that shortcut can be used)

---

We should:
- Replaces non-clickable plain text URLs found in articles with clickable HTML links.
- The user should be able to Change how dates are displayed in the interface
- Embed YouTube feeds inside article content
- Add a reading time estimation next to each article (on user configuration)
- Add touch gestures to FreshRSS. (configurable, touch screen only)

In the configurations:
- change the email (and notifications settings)
- Language of the system, implement a language switcher (following best practices of internationalization)
- add "seen" beyond "read", seen means that the user seen the article card.

---

Maintenance information:
- where the user can see how much storage is being used, and apply methods to clean/compress them up
- Installation check, with all the stats on the instalation, versions and all.
- Application logs

---

## Known Issues / Technical Debt

- Auto-generate embeddings on OPML import should be configurable via environment variable (default: true)
- OPML import is not importing feed categories properly