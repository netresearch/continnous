<template>
  <base-form
      :class="['resource-detail', 'resource-' + (this.id ? (edit ? 'edit' : 'view') : 'create')]"
      :firebase-path="getFirebasePath(trash ? 'trash' : 'resources', id || '{new}')"
      firebase-bind
      :firebase-receive="firebaseReceive"
      :defaults="{creator: auth.user.uid}"
      :keys="id ? ['updated'] : ['creator', 'created', 'updated']"
      :validate="{title: validateTitle}"
      ref="form"
      @saved="onSaved"
      @cancel="!id ? $router.back() : $router.back()"
      :disabled="!mayEdit"
  >
    <div class="resource-detail-backdrop" @click="close()"></div>
    <md-whiteframe md-elevation="2" v-if="item">
      <md-toolbar class="md-dense resource-detail-mobile-head">
        <md-whiteframe md-elevation="2"></md-whiteframe>
        <h2 class="md-title" style="flex: 1">{{personal ? $tc(type + '.personal', 2) : organization.name + ' ' + $tc(type + '.personal', 2)}}</h2>
        <md-button class="md-icon-button" @click.native="close()"><md-icon>chevron_left</md-icon></md-button>
      </md-toolbar>
      <div :class="['resource-detail-head', {'resource-detail-head-elevate': scrollTop > 0}]" v-if="item">
        <avatar v-if="id" :uid="item.creator" :organization="organization">
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
        <template v-else>
          <h3 v-if="type" style="flex: 1">{{$t(type + '.new')}}</h3>
        </template>
        <md-button v-if="!id || personal" :class="['md-icon-button', {'md-warn': personal}]" @click.native="id ? togglePersonal() : personal = !personal">
          <md-icon>
            lock_outline
            <md-tooltip>
              {{$t(type + '.this')}} {{$t('detail.is' + (personal ? 'Personal' : 'Public'))}} -
              {{$t('detail.make' + (!personal ? 'Personal' : 'Public'))}}
            </md-tooltip>
          </md-icon>
        </md-button>
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
        <template v-else>
          <md-button v-if="trash" class="md-icon-button" @click.native="toggleTrash()">
            <md-icon>delete_sweep</md-icon>
            <md-tooltip>{{$t('actions.restore')}}</md-tooltip>
          </md-button>
          <share v-if="!trash && !personal" :url="getUrl()"></share>
          <md-button class="md-icon-button" @click.native="$router.push({path: $route.path + '/edit', query: $route.query})">
            <md-icon>mode_edit</md-icon>
            <md-tooltip>{{$t('actions.editAll')}}</md-tooltip>
          </md-button>
          <md-menu v-if="(!trash || !personal) && mayEdit" md-size="5">
            <md-button class="md-icon-button" md-menu-trigger>
              <md-icon>more_vert</md-icon>
            </md-button>
            <md-menu-content>
              <md-menu-item @selected="togglePersonal()" v-if="!personal && item.creator === auth.user.uid">
                <md-icon>lock_outline</md-icon>
                <span>{{$t('detail.makePersonal')[0].toUpperCase() + $t('detail.makePersonal').substr(1)}}</span>
              </md-menu-item>
              <md-menu-item @selected="toggleTrash()" v-if="!trash">
                <md-icon>delete</md-icon>
                <span>{{$t('actions.delete')}}</span>
              </md-menu-item>
              <resource-links menu :organization="organization" :type="type" :item="item" :permissions="permissions">
              </resource-links>
            </md-menu-content>
          </md-menu>
          <md-button class="md-icon-button resource-detail-close" @click.native="close()">
            <md-icon>close</md-icon>
          </md-button>
        </template>
      </div>
      <div class="resource-detail-body" @scroll="scrollTop = $event.target.scrollTop">
        <div class="resource-detail-main">
          <div class="resource-detail-section">
            <md-icon class="md-primary">{{config.icon}}</md-icon>
            <resource-form v-if="edit || !id" :type="type" organization="organization" :personal="personal" :item="item">
              <component :is="type + '-form'"></component>
              <form-element
                  type="form-file"
                  :label="$t('fields.attachments')"
                  name="attachments"
                  multiple></form-element>
            </resource-form>
            <resource-content v-else :type="type" organization="organization" :personal="personal" :item="item">
              <component :is="type + '-content'" :item="item"></component>
            </resource-content>
          </div>
          <div class="resource-detail-section" v-if="config.results">
            <md-icon>flag</md-icon>
            <resource-results :is-new="!id" :inline="!edit" :editable="mayEdit" :organization="organization" :type="type" :item="item"></resource-results>
          </div>
          <template v-if="!edit">
            <div class="resource-detail-section" v-if="config.scoring && config.scoring.length">
              <md-icon>thumbs_up_down</md-icon>
              <resource-scoring :criteria="config.scoring" :is-new="!id" :organization="organization" :type="type" :item="item"></resource-scoring>
            </div>
            <resource-links
                class="resource-detail-links resource-detail-section"
                list
                :organization="organization"
                :type="type" :item="item"
                :permissions="permissions"
                v-if="hasLinks"
            >
              <md-icon>link</md-icon>
            </resource-links>
          </template>
        </div>
        <div class="resource-detail-aside" :style="{top: scrollTop + (scrollTop ? 'px' : '')}">
          <template v-if="id">
            <div v-if="!edit && period" class="resource-detail-section">
              <md-icon>
                date_range
                <md-tooltip>{{$t('fields.dueTime') | ucfirst}}</md-tooltip>
              </md-icon>
              <div class="resource-detail-section-content">
                {{period.format()}}
              </div>
            </div>
            <div class="resource-detail-section">
              <md-icon>local_offer</md-icon>
              <resource-tags :is-new="!id" :organization="organization" :type="type" :item="item"></resource-tags>
            </div>
            <resource-likes v-if="!edit" class="resource-detail-section" :organization="organization" :item="item">
            </resource-likes>
            <base-form sub :direct="!edit" class="resource-detail-section" v-if="mayEdit || item.attachments">
              <form-element
                  type="form-file"
                  name="attachments"
                  box
                  multiple>
              </form-element>
            </base-form>
          </template>
          <div v-else>
            <div class="resource-detail-section">
              <md-icon>thumb_up</md-icon>
              <span v-html="$t('detail.motivation', {firstName: auth.user.displayName.split(' ').shift(), displayName: auth.user.displayName})"></span>
              <p>{{$t('detail.readStatementsHint')}}</p>
            </div>
            <div class="resource-detail-section" v-for="(icon, key) in {vision: 'flare', mission: 'navigation'}">
              <md-icon>{{icon}}</md-icon>
              <span>
                <strong>{{organization[key + 'Title'] || $t(key + '.defaultTitle')}}</strong><br>
                {{organization[key]}}
              </span>
            </div>
          </div>
        </div>
        <div class="resource-detail-comments" v-if="!edit">
          <journal actions="comment" @update="comments = $event.entries.length" :organization="organization" :item="item" no-resource reverse></journal>
          <resource-comment :organization="organization" :type="type" :item="item" :personal="personal"></resource-comment>
        </div>
      </div>
    </md-whiteframe>
  </base-form>
</template>

<script>
  import BaseForm from '../../form/Base';
  import auth from '../../../auth';
  import Config from '../../../models/Config';
  import mixin from './mixin';
  import ResourceContent from './detail/Content';
  import ResourceForm from './detail/Form';
  import ResourcePublishControl from './detail/PublishControl';
  import ResourceComment from './detail/Comment';
  import ResourceResults from './detail/Results';
  import ResourceScoring from './detail/Scoring';
  import ResourceTags from './detail/Tags';
  import ResourceLikes from './detail/Likes';
  import ResourceLinks from './Links';
  import Journal from '../Journal';
  import ElasticList from '../../ElasticList';
  import Avatar from '../../Avatar';
  import Share from '../../Share';
  import Period from '../../../models/Period';

  const components = {
    BaseForm,
    ResourceContent,
    ResourceForm,
    ResourcePublishControl,
    ResourceComment,
    ResourceResults,
    ResourceScoring,
    ResourceTags,
    ResourceLikes,
    ResourceLinks,
    Journal,
    ElasticList,
    Avatar,
    Share
  };

  ['Form', 'Content'].forEach((component) => {
    /* eslint-disable global-require, import/no-dynamic-require */
    Object.keys(Config.resources).forEach((resource) => {
      components[resource + '-' + component.toLowerCase()] = require('./detail/' + resource + '/' + component);
    });
  });

  export default {
    mixins: [mixin],
    props: ['organization', 'permissions'],
    components,
    data() {
      return {
        auth,
        type: undefined,
        personal: false,
        id: undefined,
        item: undefined,
        trash: false,
        edit: false,
        scrollTop: 0,
        comments: 0,
        hasLinks: false
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
          this.trash = !!route.params.trash;
          if (this.$refs.form && (this.id !== id || this.type !== type)) {
            this.$refs.form.reset(true, true);
          }
        }
      }
    },
    computed: {
      mayEdit() {
        return this.type && this.permissions[(this.personal ? 'personal_' : '') + this.type].write;
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
        this.hasLinks = snapshot.val() ? !!(snapshot.val().links) : false;
        const item = this.createItem(snapshot.key, snapshot.val());
        this.item = item;
        if (this.id) {
          if (snapshot.val()) {
            this.trackView(item);
          } else if (!this.trash) {
            this.$router.replace(this.getUrlPath({ id: this.id, trash: true }));
          }
        }
        return item;
      },
      onSaved(updates, ref) {
        this.edit = false;
        if (!this.personal) {
          if (this.id) {
            const keys = Object.keys(updates).filter(field => field !== 'updated');
            this.organization.journal.addEntry(this.type, this.personal, this.id, 'update', keys);
          } else {
            this.organization.journal.addEntry(this.type, this.personal, ref.key, 'create');
          }
        }
        if (!this.id) {
          this.$router.replace(this.getUrlPath(this.$refs.form.firebaseRef.key));
        }
      },
      close() {
        this.$router.back();
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  $padding: 32px;
  .resource-detail {
    padding: $padding;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
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
    background: #fff;
    border-radius: 4px;
    margin: 0 auto;
    max-height: 100%;
    max-width: 1000px;
    display: flex;
    flex-flow: column;
  }
  .resource-detail-head {
    transition: all 0.2s;
    border-bottom: 1px solid rgba(#000, 0.12);
    position: relative;
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
  .resource-detail-body {
    position: relative;
    z-index: 1;
    max-height: calc(100% - 64px);
    overflow: auto;
    overflow-x: hidden;
    padding: $padding;
    padding-right: 0;
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
  .resource-detail-aside {
    position: relative;
    padding-right: $padding;
    float:right;
    width: 296px;
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
      margin-top: 2px;
    }
    .journal-time {
      display: inline;
    }
    .journal-comment {
      margin-top: 4px;
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
  .resource-detail-mobile-head {
    position: relative;
    overflow: hidden;
    padding-left: $padding;
    z-index: 3;
    .md-whiteframe {
      position: absolute;
      height: 10px;
      top: -10px;
      left: -10px;
      right: -10px;
    }
  }

  $main-max-width: 600px;
  $sidebar-from: 928px;
  $sidebar-width: 304px;
  @media (max-width: $sidebar-from) {
    .resource-detail {
      padding: 0;
      > .md-whiteframe {
        border-radius: 0;
        box-shadow: none;
        height: 100%;
      }
    }
    .resource-detail-close {
      display: none;
    }
  }
  @media (min-width: $sidebar-from) {
    .resource-detail-mobile-head {
      display: none;
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