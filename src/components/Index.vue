<template>
  <div class="index">
    <md-message
      v-if="!auth.user"
      :status="auth.ready && langLoaded ? (auth.user ? (organizations ? 1 : 0) : 2) : 0"
      :timeout="0"
      splash>
      <div v-if="langLoaded">
        {{$t('errors.401')}}
      </div>
      <md-button v-if="langLoaded" class="md-primary md-raised" @click.native="auth.login()">{{$t('auth.signIn')}}</md-button>
    </md-message>
    <template v-if="langLoaded && auth.user && organizations">
      <md-card>
        <md-card-header>
          <md-avatar>
            <img :src="auth.user.photoURL">
          </md-avatar>
          <div class="md-title">Hi {{auth.user.displayName.split(' ')[0]}},</div>
          <div class="md-subhead">{{$t('index.' + (organizations.length ? 'where' : 'welcome'))}}</div>
        </md-card-header>
        <md-card-content>
          <md-list v-if="organizations.length">
            <md-list-item :href="organization.pending ? '' : '/' + organization.key" v-for="organization in organizations">
              <span style="flex: 1 0" :class="organization.pending ? '' : 'md-primary'">{{organization.title}}</span>
              <template v-if="organization.pending">
                <md-icon>
                  lock_outline
                  <md-tooltip>{{$t('auth.membershipProcessed')}}</md-tooltip>
                </md-icon>
                <md-button
                    style="flex: 0 0;"
                    @click.native="withdrawMembershipRequest(organization)"
                    class="md-icon-button"
                    :disabled="false">
                  <md-icon>
                    undo
                    <md-tooltip>{{$t('index.withdraw')}}</md-tooltip>
                  </md-icon>
                </md-button>
              </template>
            </md-list-item>
          </md-list>
          <p v-else>{{$t('index.noOrgs')}}</p>
        </md-card-content>
        <md-card-actions>
          <md-button @click.native="auth.logout()">{{$t('auth.signOut')}}</md-button>
          <div style="flex: 1"></div>
          <md-button @click.native="$refs.dialog.open()">{{$t('organization.add')}}</md-button>
        </md-card-actions>
      </md-card>
      <md-dialog ref="dialog">
        <md-dialog-title>{{$t('organization.add')}}</md-dialog-title>
        <md-dialog-content>
          <md-input-container class="index-key" :class="{'md-input-invalid': newOrganization.exists}">
            <label>{{$t('organization.key')}}</label>
            <md-input v-model="newOrganization.key" @input="setKey" maxlength="25"></md-input>
            <md-icon class="md-warn" v-if="newOrganization.exists">
              warning
              <md-tooltip>{{$t('organization.exists')}}</md-tooltip>
            </md-icon>
          </md-input-container>
          <div class="md-caption index-caption">{{$t('organization.keyInfo')}}</div>
          <md-input-container>
            <label>{{$t('title')}}</label>
            <md-input @input="setTitle"></md-input>
          </md-input-container>
        </md-dialog-content>
        <md-dialog-actions>
          <md-button @click.native="$refs.dialog.close()">{{$t('actions.cancel')}}</md-button>
          <div style="flex: 1; min-width: 24px;"></div>
          <md-button @click.native="addOrganization" class="md-primary md-raised" :disabled="!newOrganization.valid || newOrganization.exists !== false">{{$t('organization.add')}}</md-button>
        </md-dialog-actions>
      </md-dialog>
    </template>
  </div>
</template>

<script>
  import auth from '../auth';
  import locales from '../locales';
  import Firebase from '../firebase';
  import Permissions from '../models/Permissions';
  import Flashlight from '../models/Flashlight';

  export default {
    data() {
      return {
        auth,
        langLoaded: false,
        organizations: undefined,
        newOrganization: {
          key: undefined,
          title: undefined,
          valid: false,
          exists: undefined
        }
      };
    },
    created() {
      locales.setFromNavigator().then(() => {
        this.langLoaded = true;
      });
    },
    watch: {
      'auth.user': {
        immediate: true,
        handler(user) {
          if (user) {
            Firebase.database().ref('users/' + user.uid + '/organizations').on('value', (sn) => {
              this.organizations = [];
              sn.forEach((csn) => {
                const organization = { key: csn.key, title: undefined, pending: !csn.val() };
                this.organizations.push(organization);
                Firebase.database().ref('organizations/' + csn.key + '/name').on('value', (osn) => {
                  organization.title = osn.val();
                });
              });
            });
          }
        }
      }
    },
    methods: {
      validate() {
        const organization = this.newOrganization;
        organization.valid = organization.key && organization.key.length > 1
          && organization.title && organization.title.length > 1;
      },
      setKey(key) {
        const organization = this.newOrganization;
        organization.key = key.toLowerCase().replace(/[^a-z0-9_-]/, '');
        this.validate();
        if (organization.key.length > 1) {
          organization.exists = undefined;
          Firebase.database().ref('organizations/' + organization.key + '/name').once('value', (sn) => {
            organization.exists = sn.exists();
          });
        }
      },
      setTitle(title) {
        this.newOrganization.title = title;
        this.validate();
      },
      addOrganization() {
        const organization = this.newOrganization;
        const key = 'organizations/' + organization.key;
        const security = {
          permissions: Permissions.getDefaults(),
          users: {}
        };
        security.users[auth.user.uid] = 'admin';
        Promise.all([
          Firebase.database().ref(key).set({ name: organization.title }),
          Firebase.database().ref('security/' + key).set(security),
          Flashlight.updatePaths(
            organization.key, 'organization',
            Permissions.merge(true, ...this.$objectValues(security.permissions))
          )
        ]).then(() => {
          /* global window */
          window.location.href = '/' + organization.key;
        });
      },
      withdrawMembershipRequest(organization) {
        const oid = organization.key;
        const uid = this.auth.user.uid;
        const db = Firebase.database();
        db.ref('users/organizations/' + oid + '/' + uid).remove();
        db.ref('users/' + uid + '/organizations/' + oid).remove();
        db.ref('security/organizations/' + oid + '/users/' + uid).remove();
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .index {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    div.md-list-item-container span {
      color: rgba(#000, 0.56);
    }
  }
  .index-caption {
    margin-top: -20px;
    margin-right: 56px;
  }
  .index-key {
    &.md-input-focused {
      .md-icon {
        display: none;
      }
      .md-count {
        color: inherit !important;
      }
    }
  }
</style>