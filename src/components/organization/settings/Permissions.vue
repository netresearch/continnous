<template>
  <div>
    <p class="md-caption">{{$tc('domain', 2)}}</p>
    <md-card>
      <md-card-content>
        <div class="permission-domains" v-for="(title, key) in {domains: $t('organization.domains'), guest_domains: $t('guest.domains')}">
          <div class="permission-domains-label">{{title}}</div>
          <div class="permission-domains-container">
            <div class="permission-domains-entry" v-for="(domain, index) in (values[key] || [])">
              <md-input-container md-inline>
                <label>{{$tc('domain', 1)}}</label>
                <md-input required :value="domain" @change="onDomainChange(key, index, $event)"></md-input>
              </md-input-container>
              <md-button class="md-icon-button" @click="removeDomain(key, index)">
                <md-icon>clear</md-icon>
              </md-button>
            </div>
            <md-button class="md-link" v-if="isValid(key)" @click="addDomain(key)">{{$t('addDomain')}}</md-button>
          </div>
        </div>
      </md-card-content>
      <md-card-actions>
        <md-button @click="save('domains|guest_domains')" class="md-primary md-raised" :disabled="!hasChanged('domains|guest_domains')">{{$t('actions.save')}}</md-button>
        <md-button @click="reset('domains|guest_domains')" :disabled="!hasChanged('domains|guest_domains', true)">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
      </md-card-actions>
      <md-message :status="saved['domains|guest_domains']"></md-message>
    </md-card>
    <p class="md-caption">{{$tc('permission', 2)}}</p>
    <md-card class="permissions">
      <div class="md-table">
        <table>
          <thead class="md-table-header">
            <tr class="md-table-row">
              <th class="md-table-head md-sorted">
                <div class="md-table-head-container">
                  <div class="md-table-head-text">{{$tc('permission', 1)}}</div>
                </div>
              </th>
              <th class="md-table-head md-sorted" v-for="role in roles">
                <div class="md-table-head-container">
                  <div class="md-table-head-text">{{$t('roles.' + role)}}</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="md-table-body">
            <template v-if="permissionsReceived" v-for="(privileges, resource) in defaultPermissions[roles[0]]">
              <tr class="md-table-row permissions-resource">
                <td class="md-table-cell" :colspan="roles.length + 1">
                  <div class="md-table-cell-container">{{$t('permissions.' + resource)}}</div>
                </td>
              </tr>
              <tr class="md-table-row" v-for="(defaultAllowed, privilege) in privileges">
                <td class="md-table-cell">
                  <div class="md-table-cell-container">{{$t('permissions.' + privilege)}}</div>
                </td>
                <td class="md-table-cell" v-for="role in roles">
                  <div class="md-table-cell-container">
                    <md-switch :value="values[role] && values[role][resource] && values[role][resource][privilege]" @change="onPermissionsChange(role, resource, privilege, $event)"></md-switch>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <md-card-actions>
        <md-button @click="save(roles.join('|'))" class="md-primary md-raised" :disabled="!hasChanged(roles.join('|'))">{{$t('actions.save')}}</md-button>
        <md-button @click="reset(roles.join('|'))" :disabled="!hasChanged(roles.join('|'), true)">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
        <md-button @click="resetPermissionsToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
      </md-card-actions>
    </md-card>
  </div>
</template>

<script>
  import extend from 'extend';
  import Base from './base';
  import Config from '../../../models/Config';

  export default {
    extends: Base,
    props: ['organization'],
    data() {
      return {
        permissions: {},
        defaultPermissions: Config.getDefaultPermissions(),
        roles: Config.roles,
        permissionsReceived: false
      };
    },
    objectPath: 'permissions',
    bindToFirebase: true,
    firebasePath() {
      return '/organization_permissions/' + this.organization.key;
    },
    firebaseReceive(snapshot) {
      this.$nextTick(() => {
        this.permissionsReceived = true;
      });
      return extend(true, {}, this.defaultPermissions, snapshot.val() || {});
    },
    validate: {
      domains: 'isDomainArrayValid',
      guest_domains: 'isDomainArrayValid'
    },
    methods: {
      isDomainArrayValid(domainArray) {
        let valid = true;
        (domainArray || []).forEach((domain) => {
          valid = valid && this.isDomainValid(domain);
        });
        return valid;
      },
      isDomainValid(domain) {
        return typeof domain === 'string' && domain.match(/^(?!-)(?:[a-zA-Z\d-]{0,62}[a-zA-Z\d]\.){1,126}(?!\d+)[a-zA-Z\d]{1,63}$/);
      },
      onDomainChange(type, index, domain) {
        const newDomains = this.values[type].slice(0);
        newDomains[index] = domain;
        this.onChange(type, newDomains);
      },
      addDomain(type) {
        const newDomains = (this.values[type] || []).slice(0).concat('');
        this.$set(this.values, type, newDomains);
        this.$set(this.errors, type, true);
      },
      removeDomain(type, index) {
        const newDomains = (this.values[type] || []).slice(0);
        newDomains.splice(index, 1);
        this.$set(this.values, type, newDomains);
        this.onChange(type, this.permissions.hasOwnProperty(type) ? newDomains : '');
      },
      onPermissionsChange(role, resource, privilege, allowed) {
        const newRolePermissions = extend(true, {}, this.permissions[role]);
        newRolePermissions[resource][privilege] = allowed;
        this.onChange(role, newRolePermissions);
      },
      resetPermissionsToDefaults() {
        this.roles.forEach((role) => {
          const newVal = extend(true, {}, this.defaultPermissions[role]);
          this.onChange(role, newVal);
          this.values[role] = newVal;
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .permission-domains {
    margin-top:6px;
    & + & {
      margin-top: 24px;
    }
    position: relative;
    display: flex;
    flex-flow: row wrap;
    .permission-domains-label {
      min-width: 164px;
    }
    .permission-domains-container {
      flex: 1;
      .permission-domains-entry {
        width: 100%;
        display: flex;
        flex-flow: row wrap;
        &:last-of-type {
          margin-bottom: -22px;
        }
        .md-input-container {
          flex: 1;
          margin-top: 0;
          margin-bottom: 0;
          position: relative;
          top: -22px;
        }
        .md-icon-button {
          top: -8px;
        }
      }
      > .md-button {
        margin-top: 16px;
        &:first-child {
          margin-top: 0;
        }
      }
    }
  }
  .permissions {
    tr.permissions-resource .md-table-cell {
      background: #F5F5F5 !important;
      font-weight: 500;
    }
  }
</style>