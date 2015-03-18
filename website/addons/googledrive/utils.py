# -*- coding: utf-8 -*-
"""Utility functions for the Google Drive add-on.
"""
import os
import logging
from urllib import quote

from website.util import web_url_for
from website.addons.citations import utils
from serializer import OAuthAddonSerializer


logger = logging.getLogger(__name__)


class GoogleDriveNodeLogger(object):
    """Helper class for adding correctly-formatted Google Drive logs to nodes.

    Usage: ::

        from website.project.model import NodeLog

        file_obj = GoogleDriveGuidFile(path='foo/bar.txt')
        file_obj.save()
        node = ...
        auth = ...
        nodelogger = GoogleDriveNodeLogger(node, auth, file_obj)
        nodelogger.log(NodeLog.FILE_REMOVED, save=True)


    :param Node node: The node to add logs to
    :param Auth auth: Authorization of the person who did the action.
    :param GoogleDriveGuidFile file_obj: File object for file-related logs.
    """
    def __init__(self, node, auth, file_obj=None, path=None):
        self.node = node
        self.auth = auth
        self.file_obj = file_obj
        self.path = path

    def log(self, action, extra=None, save=False):
        """Log an event. Wraps the Node#add_log method, automatically adding
        relevant parameters and prefixing log events with `"googledrive_"`.

        :param str action: Log action. Should be a class constant from NodeLog.
        :param dict extra: Extra parameters to add to the ``params`` dict of the
            new NodeLog.
        """
        params = {
            'project': self.node.parent_id,
            'node': self.node._primary_key,
            'folder': self.node.get_addon('googledrive', deleted=True).folder_path
        }
        if extra:
            params.update(extra)
        # Prefix the action with googledrive
        self.node.add_log(
            action="googledrive_{0}".format(action),
            params=params,
            auth=self.auth
        )
        if save:
            self.node.save()


def serialize_urls(node_settings):
    node = node_settings.owner
    return {
        'files': node.web_url_for('collect_file_trees'),
        'config': node.api_url_for('googledrive_config_put'),
        'create': node.api_url_for('oauth_connect',
                            service_name=node.provider_name),
        'deauthorize': node.api_url_for('googledrive_deauthorize'),
        'importAuth': node.api_url_for('googledrive_import_user_auth'),
        'get_folders': node.api_url_for('googledrive_folders'),
    }


def user_accounts(user):
    """ Gets a list of the accounts authorized by 'user' """
    return {
        'accounts': [
            utils.serialize_account(each)
            for each in user.external_accounts
            if each.provider == 'googledrive'
        ]
    }


def serialize_settings(node_settings, current_user):
    """
    View helper that returns a dictionary representation of a GoogleDriveNodeSettings record.
    Provides the return value for the googledrive config endpoints.
    """
    user_settings = node_settings.user_settings
    user_is_owner = user_settings is not None and user_settings.owner == current_user

    current_user_settings = current_user.get_addon('googledrive')
    ret = {
        'nodeHasAuth': node_settings.has_auth,
        'userIsOwner': user_is_owner,
        'userHasAuth': current_user_settings is not None and current_user_settings.has_auth,
        'urls': OAuthAddonSerializer.addon_serialized_urls()
    }

    if node_settings.has_auth:
        # Add owner's profile URL

        path = node_settings.folder_path
        if path is not None:
            ret['currentPath'] = '/' + path.lstrip('/')
            ret['currentFolder'] = '/ (Full Google Drive)' if path == '/' else '/' + path

        ret['ownerName'] = user_settings.owner.fullname
        ret['urls']['owner'] = web_url_for('profile_view_id', uid=user_settings.owner._id)

    return ret


def build_googledrive_urls(item, node, path):
    return {
        'fetch': node.api_url_for('googledrive_folders', folderId=item['id']),
        'get_folders': node.api_url_for('googledrive_folders', folderId=item['id'], path=path),
    }


def to_hgrid(item, node, path):
    """
    :param item: contents returned from Google Drive API
    :return: results formatted as required for Hgrid display
    """
    safe_name = quote(item['title'], safe='')
    path = os.path.join(path, safe_name)

    serialized = {
        'path': path,
        'id': item['id'],
        'kind': 'folder',
        'name': safe_name,
        'addon': 'googledrive',
        'urls': build_googledrive_urls(item, node, path=path)
    }
    return serialized
