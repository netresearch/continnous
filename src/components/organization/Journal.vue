<template>
  <div class="journal">
    <md-layout md-gutter md-row  v-for="entry in organization ? organization.journal.entries : []">
      <md-icon>{{resources[entry.resource].icon}}</md-icon>
      <span v-html="$t('journal.' + (entry.uid === auth.user.uid ? 'you' : 'user'), {
        action: $t('journal.' + entry.action),
        user: entry.user.displayName,
        resource: $tc(entry.resource + '.accusative', 1) + ' <em>' + entry.title + '</em>'
      })"></span>
      <md-avatar v-if="entry.user.photoURL">
        <img :src="entry.user.photoURL">
      </md-avatar>
    </md-layout>
  </div>
</template>

<script>
  import Config from '../../models/Config';
  import auth from '../../auth';

  export default {
    props: {
      organization: Object
    },
    data() {
      return {
        resources: Config.resources,
        auth
      };
    },
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .journal {
    .md-layout {
      margin: 16px;
      > span {
        flex: 1;
        margin: 0 16px;
      }
    }
  }
</style>