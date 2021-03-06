<template>
  <base-form
      :class="['resource-detail', 'resource-' + (this.id ? (edit ? 'edit' : 'view') : 'create'), {'resource-detail-archive': archive}]"
      :firebase-path="Item.getFirebasePath(type, archive, personal, id || '{new}')"
      firebase-bind
      :firebase-receive="firebaseReceive"
      :defaults="{creator: Current.user.uid}"
      :keys="id ? ['updated'] : ['creator', 'created', 'updated']"
      :validate="{title: validateTitle}"
      ref="form"
      @before-save="onBeforeSave"
      @after-save="onAfterSave"
      @saved="onSaved"
      @cancel="$router.back()"
      :disabled="!mayEdit"
  >
    <div class="resource-detail-backdrop" @click="close()"></div>
    <md-whiteframe md-elevation="2" v-if="item">
      <div :class="['resource-detail-head', {'resource-detail-head-elevate': scrollTop > 0}]" v-if="item">
        <avatar v-if="id" :uid="item.creator">
          <template scope="avatar">
            <span class="avatar-name">{{avatar.user.displayName}}</span>
            <span class="md-caption">
              {{moment(item.created).fromNow()}}
              <span v-if="item.updated > item.created">
                ({{$t('detail.updated', {ago: moment(item.updated).fromNow()})}})
              </span>
            </span>
          </template>
        </avatar>
        <h3 v-else-if="type" style="flex: 1">{{$t(type + '.new')}}</h3>
        <resource-actions
            class="md-card-actions"
            v-if="!id || !edit"
            :item="item"
            show-personal
            show-notifications
            redirect-on-toggle
            show-delete
            @togglePersonal="personal = !personal"
            @deleted="close()"
        >
          <!-- @togglePersonal happens only when !item.creator (is new) -->
        </resource-actions>
        <template v-if="edit">
          <form-button v-if="id" action="reset" class="md-icon-button" recursive>
            <md-icon>
              undo
              <md-tooltip>{{$t('actions.reset')}}</md-tooltip>
            </md-icon>
          </form-button>
          <form-button action="cancel" class="md-icon-button" recursive>
            <md-icon>
              block
              <md-tooltip>{{$t('actions.cancelEdit')}}</md-tooltip>
            </md-icon>
          </form-button>
          <form-button action="save" class="md-icon-button" recursive>
            <md-icon>
              done
              <md-tooltip>{{$t('actions.save')}}</md-tooltip>
            </md-icon>
          </form-button>
        </template>
        <md-button v-else class="md-icon-button resource-detail-close" @click.native="close()">
          <md-icon>close</md-icon>
        </md-button>
      </div>
      <div class="resource-detail-body" @scroll="scrollTop = $event.target.scrollTop">
        <div class="resource-detail-main">
          <div class="resource-detail-section">
            <md-icon class="md-primary">{{config.icon}}</md-icon>
            <resource-form v-if="edit || !id" :item="item">
              <component :is="type + '-form'"></component>
              <form-element
                  type="form-file"
                  :label="$t('fields.attachments')"
                  name="attachments"
                  multiple></form-element>
            </resource-form>
            <resource-content v-else :item="item">
              <component :is="type + '-content'" :item="item"></component>
            </resource-content>
          </div>
          <div class="resource-detail-section" v-if="config.results">
            <md-icon>flag</md-icon>
            <resource-results :is-new="!id" :inline="!edit" :editable="mayEdit" :type="type" :item="item"></resource-results>
          </div>
          <template v-if="!edit">
            <div class="resource-detail-section" v-if="config.scoring && config.scoring.length">
              <md-icon>thumbs_up_down</md-icon>
              <resource-scoring :criteria="config.scoring" :is-new="!id" :item="item"></resource-scoring>
            </div>
            <resource-links
                class="resource-detail-links resource-detail-section"
                list
                :item="item"
                v-if="hasLinks"
            >
              <md-icon>link</md-icon>
            </resource-links>
          </template>
        </div>
        <div class="resource-detail-aside">
          <template v-if="id && !edit">
            <div v-if="period" class="resource-detail-section">
              <md-icon>
                date_range
                <md-tooltip>{{$t('fields.dueTime') | ucfirst}}</md-tooltip>
              </md-icon>
              <div class="resource-detail-section-content">
                {{period.format()}}
              </div>
            </div>
            <resource-likes class="resource-detail-section" :item="item">
            </resource-likes>
            <div class="resource-detail-section" v-if="item.parties && item.parties.length">
              <md-icon>
                group
                <md-tooltip>{{$t('fields.parties')}}</md-tooltip>
              </md-icon>
              <div v-for="uid in item.parties">
                <avatar :uid="uid" mini></avatar>
              </div>
            </div>
            <div class="resource-detail-section" v-if="item.tags">
              <md-icon>local_offer</md-icon>
              <resource-tags :item="item"></resource-tags>
            </div>
            <base-form sub direct class="resource-detail-section" v-if="mayEdit || item.attachments">
              <form-element
                  type="form-file"
                  name="attachments"
                  box
                  multiple>
              </form-element>
            </base-form>
          </template>
          <form-toc v-else-if="id && edit"></form-toc>
          <div v-else-if="!id">
            <div class="resource-detail-section">
              <md-icon>thumb_up</md-icon>
              <span v-html="$t('detail.motivation', {firstName: Current.user.displayName.split(' ').shift(), displayName: Current.user.displayName})"></span>
              <p>{{$t('detail.readStatementsHint')}}</p>
            </div>
            <div class="resource-detail-section" v-for="(icon, key) in {vision: 'flare', mission: 'navigation'}">
              <md-icon>{{icon}}</md-icon>
              <span>
                <strong>{{Current.organization[key + 'Title'] || $t(key + '.defaultTitle')}}</strong><br>
                {{Current.organization[key]}}
              </span>
            </div>
          </div>
        </div>
        <div class="resource-detail-comments" v-if="!edit">
          <resource-comments :item="item"></resource-comments>
        </div>
      </div>
    </md-whiteframe>
  </base-form>
</template>

<script>
  import BaseForm from '../../form/Base';
  import Config from '../../../models/Config';
  import mixin from './mixin';
  import ResourceContent from './detail/Content';
  import ResourceForm from './detail/Form';
  import ResourceComments from './detail/Comments';
  import ResourceResults from './detail/Results';
  import ResourceScoring from './detail/Scoring';
  import ResourceTags from './detail/Tags';
  import ResourceLikes from './detail/Likes';
  import ResourceLinks from './Links';
  import ResourceActions from './Actions';
  import Journal from '../common/Journal';
  import Avatar from '../../Avatar';
  import Period from '../../../models/Period';
  import Mentions from '../../../models/Mentions';
  import Item from '../../../models/Item';
  import Current from '../../../models/Current';

  const components = {
    BaseForm,
    ResourceContent,
    ResourceForm,
    ResourceComments,
    ResourceResults,
    ResourceScoring,
    ResourceTags,
    ResourceLikes,
    ResourceLinks,
    ResourceActions,
    Journal,
    Avatar
  };

  ['Form', 'Content'].forEach((component) => {
    /* eslint-disable global-require, import/no-dynamic-require */
    Object.keys(Config.resources).forEach((resource) => {
      components[resource + '-' + component.toLowerCase()] = require('./detail/' + resource + '/' + component);
    });
  });

  export default {
    mixins: [mixin],
    components,
    data() {
      return {
        type: undefined,
        personal: false,
        id: undefined,
        item: undefined,
        archive: false,
        edit: false,
        scrollTop: 0,
        hasLinks: false,
        Item,
        Current
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          const id = this.id;
          const type = this.type;
          this.personal = !!route.params.personal || !!route.query.personal;
          this.type = route.params.type || route.query.type;
          this.id = route.params.id || null;
          this.edit = !this.id || !!route.params.edit;
          this.archive = !!route.params.archive;
          if (this.$refs.form && (this.id !== id || this.type !== type)) {
            this.$refs.form.reset(true, true);
          }
        }
      }
    },
    computed: {
      mayEdit() {
        return this.type && Current.permissions[(this.personal ? 'personal_' : '') + this.type].write;
      },
      config() {
        return this.type ? Config.resources[this.type] : {};
      },
      period() {
        if (this.config.periodical && this.item && this.item.dueTime) {
          return new Period(new Date(this.item.dueTime));
        }
        return undefined;
      }
    },
    methods: {
      validateTitle(title) {
        return title && title.length > 2;
      },
      firebaseReceive(snapshot) {
        this.hasLinks = false;
        const item = new Item(this.type, snapshot.key, snapshot.val(), this.archive, this.personal);
        if (this.id) {
          if (snapshot.val()) {
            this.item = item;
            this.hasLinks = 0;
            Object.keys(item.links).forEach((resource) => {
              this.hasLinks += Object.keys(item.links[resource]).length;
            });
            this.trackView(item);
          } else if (!this.archive && (!this.item || this.item.id !== this.id)) {
            this.$router.replace(this.getUrlPath({ id: this.id, archive: true }));
          }
        } else {
          this.item = item;
        }
        return item;
      },
      getMentions(object) {
        const m = [];
        Object.keys(object).forEach((field) => {
          Mentions.getMentions(object[field], '@').forEach(uid => m.push(uid));
        });
        this.$refs.form.getElements(true).forEach((element) => {
          if (element.name && element.type === 'user-input') {
            if (object[element.name]) {
              object[element.name].forEach(uid => m.push(uid));
            }
          }
        });
        return m;
      },
      onBeforeSave() {
        this.previousMentions = this.id ? this.getMentions(this.item) : [];
      },
      onAfterSave(updates, promises) {
        if (!this.personal) {
          const item = Object.assign({}, this.item, updates);
          const mentions = {};
          const m = this.getMentions(item);
          const pm = this.previousMentions;
          m.concat(pm).forEach((uid) => {
            if (!this.id || pm.indexOf(uid) < 0) {
              mentions[uid] = true;
            } else if (this.id && pm.indexOf(uid) >= 0 && m.indexOf(uid) < 0) {
              mentions[uid] = false;
            }
          });
          promises.push(Current.organization.journal.addEntry(
            item,
            this.id ? 'update' : 'create',
            this.id ? Object.keys(updates).filter(field => field !== 'updated') : null,
            null,
            { mentions }
          ));
        }
      },
      onSaved() {
        this.edit = false;
        if (!this.id) {
          this.$router.replace(this.getUrlPath(this.$refs.form.firebaseRef.key));
        } else {
          this.$router.back();
        }
      },
      close() {
        if (this.$root.historyLength) {
          this.$router.back();
        } else {
          this.$router.replace({
            path: this.getUrlPath(Object.assign(
                {}, this.$route.params, { id: undefined, edit: undefined }
            )),
            query: this.$route.query
          });
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  $padding: 32px;
  .resource-detail {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 4;
    padding-top: 16px;
  }
  .resource-detail-backdrop {
    background: rgba(#000, 0.36);
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
  }
  .resource-detail-close {
    margin-right: -12px !important;
    color: rgba(#000, 0.56);
  }
  .resource-detail > .md-whiteframe {
    overflow: hidden;
    background: #fff;
    max-height: 100%;
    max-width: 1000px;
    display: flex;
    flex-flow: column;
    margin: 0 auto;
  }
  .resource-detail-head {
    transition: all 0.2s;
    border-bottom: 1px solid rgba(#000, 0.12);
    position: static;
    top: 0;
    z-index: 2;
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    padding: 12px $padding;
    height: 64px;
    min-height: 64px;
    &.resource-detail-head-elevate {
      box-shadow: -10px -2px 16px -3px rgba(0, 0, 0, 0.6);
    }
    .avatar {
      flex: 1;
    }
    .md-button {
      margin: 0;
    }
  }
  .resource-detail-archive {
    .resource-detail-head {
      background:
        linear-gradient(
          to right,
          rgba(#fff, 0),
          rgba(#fff, 1)
        ),
        repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 5px,
          rgba(#000, 0.09) 5px,
          rgba(#000, 0.09) 10px
        );
    }
  }
  .resource-detail-body {
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    z-index: 1;
    max-height: calc(100% - 64px);
    padding: 0 0 $padding $padding;
    &:after {
      content: ".";
      clear: both;
      display: block;
      visibility: hidden;
      height: 0px;
    }
  }
  .resource-detail-main,
  .resource-detail-comments {
    width: calc(100% - 296px);
    padding-right: $padding;
    float: left;
  }
  .resource-detail-main {
    padding-top: $padding;
  }
  .resource-detail-aside {
    position: sticky;
    top: 0;
    padding-top: $padding;
    padding-right: $padding;
    float:right;
    width: 296px;
    .form-toc {
      margin: 8px 0 0 16px;
      padding: 8px 24px;
      border-left: 1px solid rgba(#000, 0.12);
      .form-toc-entry {
        padding: 8px 0;
        .form-toc-active {
          font-weight: 500;
        }
      }
    }
  }
  .resource-detail-links {
    padding-top: 1px;
    .resource-link {
      &:first-of-type {
        margin-top: -8px;
      }
      .md-list {
        margin: 0;
        padding: 0;
      }
    }
  }
  .resource-detail-comments {
    &:before {
      content: "";
      display: block;
      margin: 16px 0 16px 0;
      height: 1px;
      background: rgba(0, 0, 0, 0.12);
    }
    .journal-entry {
    }
    .journal-time {
      display: inline;
    }
    .journal-comment {
      margin-top: 2px;
      //margin-left: 16px;
    }
  }

  .resource-detail-section {
    position: relative;
    padding-left: 40px;
    &:after {
      content: "";
      display: block;
      margin: 16px 0 16px -40px;
      height: 1px;
      background: rgba(0, 0, 0, 0.12);
    }
    &:last-child:after {
      display: none;
    }
    > .md-icon {
      position: absolute;
      color: rgba(#000, 0.32);
      left: 6px;
      top: 0px;
    }
    &:first-child > .md-icon {
      top: -2px;
    }
    .resource-detail-section-content {
      padding-top: 4px;
    }
  }
  .resource-detail-section-head {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    margin: -4px 0 16px;
    border-bottom: 1px solid rgba(#000, 0.1);
    padding-bottom: 12px;
    span {
      flex: 1 0 auto;
      color: rgba(0, 0, 0, 0.56);
    }
    &.active {
      border-bottom: 2px solid rgba(#000, 0.2);
      span {
        color: inherit;
        font-size: 18px;
      }
    }
    > .md-icon {
      cursor: pointer;
      color: rgba(0, 0, 0, 0.56);
      margin-left: 10px;
    }
    .md-button {
      margin:-8px 0;
    }
  }
  .resource-detail-main .resource-detail-section {
    &:after {
      margin-top: 24px;
      margin-bottom: 24px;
    }
  }
  .resource-detail-aside {
    .resource-detail-section {
      &:after {
        background: rgba(#000, 0.1);
      }
    }
    .form-element-attachments {
      .md-input-container,
      .form-file-container {
        position: static;
      }
      .md-input-container {
        padding-top: 0;
        margin: 0;
        &:after {
          display: none;
        }
      }
      .form-file-box span {
        display: block;
        text-align: center;
      }
      .form-file-box .md-icon {
        position: absolute;
        left: 6px;
        top: 0px;
        margin: 0;
      }
      .form-file-list {
        margin-top: -4px;
      }
    }
  }
  .has-mouse .resource-detail-aside .form-file-info {
    overflow: hidden;
    position: relative;
    .md-icon {
      position: absolute;
      right: -28px;
      transition: right 0.2s;
      box-shadow: -7px 0px 20px 0px rgba(255,255,255,1);
    }
    &:hover .md-icon {
      right: 0;
    }
  }


  /*
      Mobile stuff
  */
  $detail-max-width: 1000px;
  $main-max-width: 600px;
  $sidebar-from: 600px;
  $sidebar-width: 64px;
  @media (max-width: $detail-max-width + $sidebar-width) {
    .resource-detail {
      padding: 0;
      > .md-whiteframe {
        box-shadow: none;
        height: 100%;
      }
    }
  }
  @media (max-width: $sidebar-from) {
    .resource-detail-body, .resource-detail-head {
      padding-left: 16px;
    }
    .resource-detail-head,
    .resource-detail-main,
    .resource-detail-aside {
      padding-right: 16px;
    }
  }
  @media (min-width: $sidebar-from) and (max-width: $sidebar-width + $main-max-width + ((4 * $padding) + 40px)),
  (max-width: $main-max-width + (2 * $padding)) {
    .resource-detail-main,
    .resource-detail-comments {
      width: 100%;
      float: none;
    }
    .resource-detail-comments:before {
      margin-left: -1 * $padding;
      margin-right: -1 * $padding;
    }
    .resource-detail-aside {
      position: static;
      width: 100%;
      float: none;
      &:before {
        content: "";
        display: block;
        margin: $padding -1 * $padding 16px -1 * $padding;
        height: 1px;
        background: rgba(0, 0, 0, 0.12);
      }
    }
  }
</style>