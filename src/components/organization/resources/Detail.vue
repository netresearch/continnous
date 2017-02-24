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
      :disabled="!mayEdit"
  >
    <md-whiteframe md-elevation="2" v-if="item">
      <div :class="['resource-detail-head']" v-if="item && id">
        <avatar :uid="item.creator" :organization="organization">
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
        <md-button class="md-icon-button" @click="edit = !edit">
          <md-icon>mode_edit</md-icon>
        </md-button>
        <template v-if="item.creator === auth.user.uid">
          <div class="md-caption">
                <span>
                  {{$t(type + '.this')}} {{$t('detail.is' + (personal ? 'Personal' : 'Public'))}}
                  - <span class="md-link" @click="togglePersonal">{{$t('detail.make' + (!personal ? 'Personal' : 'Public'))}}</span>
                </span>
          </div>
        </template>
      </div>
      <div class="resource-detail-body" @scroll="scrollTop = $event.target.scrollTop">
        <div class="resource-detail-main">
          <div class="resource-detail-section">
            <md-icon class="md-primary">{{config.icon}}</md-icon>
            <resource-form v-if="edit" :type="type" organization="organization" :personal="personal" :item="item">
              <form-element
                  type="form-file"
                  :label="$t('fields.attachments')"
                  name="attachments"
                  multiple></form-element>
            </resource-form>
            <resource-content v-else :type="type" organization="organization" :personal="personal" :item="item"></resource-content>
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
          </template>
        </div>
        <div class="resource-detail-aside" :style="{top: scrollTop + (scrollTop ? 'px' : '')}">
          <div class="resource-detail-section">
            <md-icon>local_offer</md-icon>
            <resource-tags :is-new="!id" :organization="organization" :type="type" :item="item"></resource-tags>
          </div>
          <resource-likes v-if="id" class="resource-detail-section" :organization="organization" :item="item">
          </resource-likes>
          <base-form sub direct class="resource-detail-section" v-if="!edit && (mayEdit || item.attachments)">
            <md-icon>attach_file</md-icon>
            <form-element
                type="form-file"
                :label="$t('fields.attachments')"
                name="attachments"
                multiple>
            </form-element>
          </base-form>
          <div v-if="!id">
            <p class="md-caption">
              <md-icon>thumb_up</md-icon>
              <span v-html="$t('detail.motivation', {firstName: auth.user.displayName.split(' ').shift(), displayName: auth.user.displayName})"></span>
            </p>
            <p class="md-caption" style="margin-left: 22px;">
              {{$t('detail.readStatementsHint')}}
            </p>
            <template v-for="(icon, key) in {vision: 'flare', mission: 'navigation'}">
              <p class="md-caption">
                <md-icon>{{icon}}</md-icon>
                <span>
                  <strong>{{organization[key + 'Title'] || $t(key + '.defaultTitle')}}</strong><br>
                  {{organization[key]}}
                </span>
              </p>
            </template>
          </div>
        </div>
        <div class="resource-detail-comments">
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
  import Journal from '../Journal';
  import ElasticList from '../../ElasticList';
  import Avatar from '../../Avatar';

  export default {
    mixins: [mixin],
    props: ['organization', 'permissions'],
    components: {
      BaseForm,
      ResourceContent,
      ResourceForm,
      ResourcePublishControl,
      ResourceComment,
      ResourceResults,
      ResourceScoring,
      ResourceTags,
      ResourceLikes,
      Journal,
      ElasticList,
      Avatar
    },
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
        comments: 0
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          this.personal = !!route.params.personal;
          this.type = route.params.type;
          this.id = route.params.id || null;
          this.edit = !this.id;
          this.trash = !!route.params.trash;
          if (this.$refs.form) {
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
      }
    },
    methods: {
      validateTitle(title) {
        return title && title.length > 2;
      },
      firebaseReceive(snapshot) {
        const item = this.createItem(snapshot.key, snapshot.val());
        this.item = item;
        if (this.id) {
          this.trackView(item);
        }
        return item;
      },
      onSaved(updates, ref) {
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
      togglePersonal() {
        this.organization.journal.getRef()
          .orderByChild('id')
          .equalTo(this.item.id)
          .once('value', (sn) => {
            sn.forEach((csn) => {
              csn.ref.update({ personal: !this.personal });
            });
          });
        this.getFirebaseRef('resources', this.item.id, !this.personal).set(this.item).then(() => {
          this.getFirebaseRef('resources', this.item.id).remove().then(() => {
            this.$router.replace(this.getUrlPath(this.item.id, !this.personal));
          });
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  $padding: 32px;
  .resource-detail {
    height: 100%;
    padding: $padding;
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
    &.resource-detail-head-elevate {
      box-shadow: -10px -2px 16px -3px rgba(0, 0, 0, 0.6);
    }
    .avatar {
      flex: 1;
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
  .resource-detail-comments {
    &:before {
      content: "";
      display: block;
      margin: 16px 0 16px 0;
      height: 1px;
      background: rgba(0, 0, 0, 0.1);
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
  $main-max-width: 600px;
  $sidebar-from: 928px;
  $sidebar-width: 304px;
  @media (max-width: $sidebar-from) {
    .resource-detail {
      padding: 0;
    }
  }
  @media (min-width: $sidebar-from) and (max-width: $sidebar-width + $main-max-width + (4 * $padding)),
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
        background: rgba(0, 0, 0, 0.1);
      }
    }
  }

  .resource-detail-section {
    position: relative;
    padding-left: 40px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    &:after {
      content: "";
      display: block;
      margin: 16px 0 16px -40px;
      height: 1px;
      background: rgba(0, 0, 0, 0.1);
    }
    margin-bottom: 16px;
    &:first-of-type,
    & + & {
      border-top: none;
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
  }
  .resource-detail-main .resource-detail-section {
    &:after {
      margin-top: 24px;
      margin-bottom: 24px;
    }
  }
  .resource-detail-aside {

  }
</style>