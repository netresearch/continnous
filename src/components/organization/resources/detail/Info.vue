<template>
  <div class="resource-detail-info">
    <avatar :uid="item.creator">
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
    <hr>
    <template v-if="item.creator === Current.user.uid">
      <p class="md-caption">
        <span>
          {{$t(type + '.this')}} {{$t('detail.is' + (personal ? 'Personal' : 'Public'))}}
          - <span class="md-link" @click="togglePersonal">{{$t('detail.make' + (!personal ? 'Personal' : 'Public'))}}</span>
        </span>
      </p>
      <hr>
    </template>
  </div>
</template>

<script>
  import Avatar from '../../../Avatar';
  import mixin from '../mixin';
  import Current from '../../../../models/Current';

  export default {
    mixins: [mixin],
    props: {
      item: Object,
      personal: Boolean,
      type: String
    },
    components: { Avatar },
    data() {
      return {
        Current
      };
    },
    methods: {
      togglePersonal() {
        Current.organization.journal.getRef()
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
  .resource-detail-info > .md-caption {
    margin-bottom: 10px;
  }
</style>