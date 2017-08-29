import xhr from 'xhr';
import ConfigurationForm from './Configuration';
import Current from '../../models/Current';
import File from '../../models/File';
import User from '../../models/User';
import Config from '../../models/Config';

export default class SlackWebhook {
  constructor(options) {
    this.url = options.url;
    this.bigImages = options.bigImages;
  }

  static label = 'Slack Incoming WebHook';
  static configurationForm = ConfigurationForm;

  /**
   * @param {JournalEntry} entry
   */
  onJournalEntryAdd(entry) {
    return this.getMessage(entry).then(body => new Promise((resolve) => {
      xhr.post(
        this.url,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'payload=' + encodeURIComponent(JSON.stringify(body))
        },
        resolve
      );
    }));
  }

  getMessage(entry) {
    const organization = entry.journal.organization;
    const creator = new User(entry.item.creator, organization);
    const app = Current.app;
    const item = entry.item;
    const data = {};
    const promises = [
      new Promise((r) => {
        creator.ref().once('value', () => {
          data.author_name = creator.displayName;
          data.author_link = app.getAbsoluteUrl({ user: creator });
          r();
        });
      })
    ];
    if (item.image) {
      promises.push(new Promise((r) => {
        File[this.bigImages ? 'getURL' : 'getPreviewURL'](item.image, (src) => {
          data[this.bigImages ? 'image_url' : 'thumb_url'] = src;
          r();
        });
      }));
    }

    data.pretext = '<'
      + app.getAbsoluteUrl({ user: Current.user })
      + '|' + Current.user.displayName
      + '> '
      + entry.action.replace(/t$/, 'te') + 'd '
      + (entry.action === 'comment' ? 'on ' : '')
      + item.resource;

    data.fallback = data.pretext + ' <'
      + app.getAbsoluteUrl(item)
      + '|' + item.title + '>';

    data.title = item.title;
    data.title_link = app.getAbsoluteUrl(item);
    data.ts = +new Date();
    data.footer = organization.title
      || (organization.name + ' ' + app.$t('thisPlatform'));
    data.fields = [];

    if (entry.action === 'archive') {
      const status = Config.resources[entry.resource].transitions.occasions.reverse().find(
        occasion => entry[occasion] === true
      );
      if (status) {
        data.fields.push({ title: 'Status', value: status });
      }
    }
    if (entry.fields) {
      data.fields.push({
        title: 'Field' + (entry.fields.length > 1 ? 's' : ''),
        value: entry.fields.join(', ')
      });
    }
    if (entry.comment) {
      data.fields.push({
        title: 'Comment',
        value: entry.comment.replace(/(<([^>]+)>)/ig, '')
      });
    }

    if (organization.favicon || organization.icon) {
      promises.push(new Promise((r) => {
        File.getURL(organization.favicon || organization.icon, (src) => {
          data.footer_icon = src;
          r();
        });
      }));
    }

    if (item.description) {
      data.text = item.text;
    }
    return Promise.all(promises).then(
      () => Promise.resolve({ attachments: [data] })
    );
  }
}
