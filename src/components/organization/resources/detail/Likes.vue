<template>
  <div class="resource-detail-likes">
    <md-icon :class="userLikes ? 'md-primary' : 'resource-detail-no-like'" @click.native="setLike(item, !userLikes)">
      favorite
      <md-tooltip>{{$t('actions.' + (userLikes ? 'unlike' : 'like'))}}</md-tooltip>
    </md-icon>
    <span class="resource-detail-likers" v-if="likes.length || userLikes">
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
    <span class="resource-detail-likers" v-else>{{$t('detail.beFirstToLike')}}</span>
  </div>
</template>

<script>
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
    data() {
      return {
        auth,
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
    },
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  @keyframes bounce-heart {
    0%, 20%, 60%, 100% {
      margin-left: 0;
      font-size: 24px;
    }

    40%, 80% {
      font-size: 32px;
      margin-left: -4px;
    }
  }

  .resource-detail-likes {
    > .md-icon {
      min-height: 24px;
      cursor: pointer;
      transition: color 0.4s;
      &.resource-detail-no-like:hover {
        animation: bounce-heart 1s;
      }
      &.md-primary:hover {
        color: rgba(#000, 0.56);
      }
    }
  }
  .resource-detail-likers {
    color: rgba(#000, 0.56);
    display: inline-block;
    margin-top: 3px;
  }
</style>