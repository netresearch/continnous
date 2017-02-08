<template>
  <div class="resource-detail-info">
    <p class="md-caption">{{$t('detail.contributedBy')}}</p>
    <avatar big :uid="item.creator" :organization="organization" :you="$t('detail.you')">
      <span class="md-caption">
        {{moment(item.created).fromNow()}}<br>
        <span v-if="item.updated > item.created">
          ({{$t('detail.updated', {ago: moment(item.updated).fromNow()})}})
        </span>
      </span>
    </avatar>
    <hr>
    <div>
      <span class="md-icon-link" @click="setLike(item, !userLikes)">
        <md-icon>favorite{{userLikes ? '_border' : ''}}</md-icon>
        {{$t('actions.' + (userLikes ? 'unlike' : 'like'))}}
      </span><br>
      <span class="md-caption" v-if="likes.length || userLikes">
        {{userLikes ? $t('detail.you') + (likes.length > 1 ? ',' : (likes.length ? ' ' + $t('and') : '')) : ''}}
        <span :style="{display: showAllLikers ? 'block' : 'inline'}" v-for="i in numLikerNames" v-if="i <= likes.length">
          {{likes[i - 1].toString() + (i < likes.length && (!userLikes || likes.length > 1) ? (i === likes.length - 1 ? ' ' + (likes.length > numLikerNames ? '' : $t('and')) : ',') : '')}}
        </span>
        <template v-if="likes.length > numLikerNames && !showAllLikers">
          {{$t('and')}} <span class="md-link" @click="showAllLikers = true">{{likes.length - numLikerNames}} {{$t('detail.others')}}</span>
        </template>
        <span style="white-space: nowrap">{{$t('detail.likeThis')}}.</span>
        <span class="md-link" v-if="showAllLikers" @click="showAllLikers = false"><md-icon>keyboard_arrow_up</md-icon></span>
      </span>
      <span class="md-caption" v-else>{{$t('detail.beFirstToLike')}}</span>
    </div>
    <hr>
    <div>
      <md-chip>Tags</md-chip>
      <md-chip>are</md-chip>
      <md-chip>not</md-chip>
      <md-chip>yet</md-chip>
      <md-chip>implemented</md-chip>
    </div>
  </div>
</template>

<script>
  import Avatar from '../../../Avatar';
  import mixin from '../mixin';
  import User from '../../../../models/User';
  import auth from '../../../../auth';

  export default {
    mixins: [mixin],
    props: {
      item: Object,
      organization: Object,
      likerNamesLimit: {
        type: Number,
        default: 2
      },
    },
    components: { Avatar },
    data() {
      return {
        likes: [],
        userLikes: false,
        showAllLikers: false
      };
    },
    computed: {
      numLikerNames() {
        return this.showAllLikers ? this.likes.length : this.likerNamesLimit;
      }
    },
    watch: {
      showAllLikers(show) {
        if (show) {
          this.likes.forEach((user, i) => {
            if (typeof user !== 'object') {
              this.likes[i] = new User(user, this.organization);
            }
          });
        }
      },
      'item.id': {
        immediate: true,
        handler(id) {
          this.getLikesRef(id, true).on('value', (snapshot) => {
            this.likes = [];
            this.userLikes = false;
            let i = 0;
            snapshot.forEach((user) => {
              if (user.key === auth.user.uid) {
                this.userLikes = true;
              } else {
                this.likes.push(
                  i < this.numLikerNames ? new User(user.key, this.organization) : user.key
                );
                i++;
              }
            });
          });
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-detail-info > .md-caption {
    margin-bottom: 10px;
    &:not(:first-child) {
      border-top: 1px solid rgba(#000, 0.1);
      padding-top: 8px;
    }
  }
</style>